import type { MeasuredDimensions } from "react-native-reanimated";
import { isTeleportAvailable } from "../../../../components/boundary/portal/teleport";
import {
	ENTER_RANGE,
	EXIT_RANGE,
	FULLSCREEN_DIMENSIONS,
	NO_STYLES,
} from "../../../../constants";
import {
	getScreenMountOrder,
	getScreenProgress,
	isScreenClosing,
	isScreenNewer,
} from "../../../../providers/motion/helpers/progress-registry";
import { toLayoutSpace } from "../../../../providers/orchestrator/styles/helpers/bounds-screen-frames";
import {
	createScreenPairKey,
	getDestinationScreenKeyFromPairKey,
	getSourceScreenKeyFromPairKey,
} from "../../../../stores/bounds/helpers/link-pairs.helpers";
import { getEntry } from "../../../../stores/bounds/internals/entries";
import {
	getResolvedLink,
	requestSourceMeasure,
} from "../../../../stores/bounds/internals/links";
import {
	resolveScreenPairKey,
	resolveTransitionPair,
} from "../../../../stores/bounds/internals/resolver";
import { pairs } from "../../../../stores/bounds/internals/state";
import type { ScreenTransitionState } from "../../../../types/animation.types";
import type { Layout } from "../../../../types/screen.types";
import type {
	BoundId,
	BoundsComputeParams,
	BoundsInternalOptions,
} from "../../types/options";
import {
	computeContentTransformGeometry,
	computeRelativeGeometry,
} from "../geometry";
import {
	composeContentStyle,
	composeSizeAbsolute,
	composeSizeRelative,
	composeTransformAbsolute,
	composeTransformRelative,
	type ElementComposeParams,
} from "./composers";
import {
	attachBoundsScreenFrame,
	type MeasuredScreenTransform,
	type StartPair,
} from "./screen-frame";

type MeasuredWith = MeasuredDimensions & {
	screenTransform?: MeasuredScreenTransform;
};

const MAX_CHAIN_DEPTH = 6;

/**
 * The closing screen that draws an element right now, among those mounted before `screenKey`: the
 * latest one (an older one's copy is hidden while it is, see isTakenByNewerScreen). A newer screen
 * takes the element from there when its own transition starts: spamming push and pop moves one
 * element, from wherever it is.
 */
const resolveClosingPresenter = (
	tag: string,
	screenKey: string,
): {
	pairKey: string;
	source: string;
	destination: string;
	t: number;
} | null => {
	"worklet";
	const state = pairs.get();
	// The latest screen before this one that has the element: it is the one drawing it (an older
	// one's copy is hidden while it is). Only a closing one hands it over from where it is.
	let latest: {
		pairKey: string;
		source: string;
		destination: string;
	} | null = null;
	let latestOrder = 0;
	for (const pairKey in state) {
		const destination = getDestinationScreenKeyFromPairKey(pairKey);
		const source = getSourceScreenKeyFromPairKey(pairKey);
		if (!destination || !source || destination === screenKey) continue;
		if (!isScreenNewer(screenKey, destination)) continue;
		const order = getScreenMountOrder(destination);
		if (order <= latestOrder) continue;
		if (!getResolvedLink(pairKey, tag).link?.destination?.bounds) continue;
		latest = { pairKey, source, destination };
		latestOrder = order;
	}
	if (!latest || !isScreenClosing(latest.destination)) return null;
	const t = getScreenProgress(latest.destination);
	if (t === undefined || t <= 0 || t >= 1) return null;
	return { ...latest, t };
};

/** How far apart two rects are (the larger of their position and size differences). */
const spanOf = (
	a: { pageX: number; pageY: number; width: number; height: number },
	b: { pageX: number; pageY: number; width: number; height: number },
) => {
	"worklet";
	return Math.max(
		Math.abs(b.pageX - a.pageX),
		Math.abs(b.pageY - a.pageY),
		Math.abs(b.width - a.width),
		Math.abs(b.height - a.height),
	);
};

/** Within this many px of its source slot, a closing pair's element has landed. */
const LANDED_PX = 2;

/**
 * Whether a closing pair's element has landed: its destination is closing and the element is
 * within LANDED_PX of its source slot (its spring's tail, the screen all but gone). A landed pair
 * no longer holds the element: popping the screen below then is carried by that screen's own pair.
 * Never for handoff (the live content is in the destination's slot until it lands home), and only
 * with Teleport: inline, the leaving copy is clipped away with its screen and never carries on.
 */
const isPairLanded = (
	pairKey: string,
	tag: string,
	destination: string,
): boolean => {
	"worklet";
	if (!isTeleportAvailable || !isScreenClosing(destination)) return false;
	if (getEntry(tag, destination)?.handoff) return false;
	const link = getResolvedLink(pairKey, tag).link;
	const from = link?.source?.bounds;
	const to = link?.destination?.bounds;
	const t = getScreenProgress(destination);
	if (!from || !to || t === undefined) return false;
	return t * spanOf(from, to) < LANDED_PX;
};

/**
 * A closing screen whose element a newer screen has taken (see resolveClosingPresenter) no longer
 * draws it: the newer one does, from where this one had it. A newer pair that has landed doesn't.
 */
const isTakenByNewerScreen = (
	tag: string,
	destinationScreenKey: string,
): boolean => {
	"worklet";
	if (!isScreenClosing(destinationScreenKey)) return false;
	const state = pairs.get();
	for (const pairKey in state) {
		const destination = getDestinationScreenKeyFromPairKey(pairKey);
		if (!destination || destination === destinationScreenKey) continue;
		if (!isScreenNewer(destination, destinationScreenKey)) continue;
		const t = getScreenProgress(destination);
		if (t === undefined || t <= 0) continue;
		if (isPairLanded(pairKey, tag, destination)) continue;
		if (getResolvedLink(pairKey, tag).link?.destination?.bounds) return true;
	}
	return false;
};

/**
 * Whether the element of a pair into `destinationScreenKey` has moved on: a newer screen pushed on
 * top of the destination opened its own pair from it (a chain pushed while the first pair still
 * opens). The source's copy of the first pair stops drawing: the destination's copy carries the
 * element on, from where it is drawn (resolveStartChain). Seen through a translucent destination,
 * the source's copy would otherwise keep heading for the destination's slot: a second card.
 */
const isMovedOnFrom = (tag: string, destinationScreenKey: string): boolean => {
	"worklet";
	const state = pairs.get();
	for (const pairKey in state) {
		if (getSourceScreenKeyFromPairKey(pairKey) !== destinationScreenKey)
			continue;
		const destination = getDestinationScreenKeyFromPairKey(pairKey);
		if (!destination || !isScreenNewer(destination, destinationScreenKey))
			continue;
		const t = getScreenProgress(destination);
		if (t === undefined || t <= 0) continue;
		if (isPairLanded(pairKey, tag, destination)) continue;
		if (getResolvedLink(pairKey, tag).link?.destination?.bounds) return true;
	}
	return false;
};

/**
 * The pair whose element a pair from `sourceScreenKey` to `destinationScreenKey` starts from, when
 * the element is not at its source slot right now:
 * - an older screen still closing draws it (push, pop and push again quickly): that one;
 * - the source screen is itself still moving in its own pair (a chain: Theater pushed while Detail
 *   still opens, or closing while Detail closes too): that pair.
 */
const resolveStartPair = (
	tag: string,
	sourceScreenKey: string,
	destinationScreenKey: string,
): StartPair | null => {
	"worklet";
	const presenter = resolveClosingPresenter(tag, destinationScreenKey);
	if (presenter && presenter.destination !== sourceScreenKey) return presenter;
	const t = getScreenProgress(sourceScreenKey);
	if (t === undefined || t >= 1) return null;
	const upstream = resolveTransitionPair(tag, {
		currentScreenKey: sourceScreenKey,
		entering: true,
	});
	if (
		!upstream.sourceScreenKey ||
		upstream.destinationScreenKey !== sourceScreenKey
	) {
		return null;
	}
	return {
		pairKey: createScreenPairKey(upstream.sourceScreenKey, sourceScreenKey),
		source: upstream.sourceScreenKey,
		destination: sourceScreenKey,
		t: Math.max(0, t),
	};
};

/**
 * The pairs an element starts from when it is not at its source slot right now (see
 * resolveStartPair), nearest first: that pair's own start may be moving too (a chain spammed). Only
 * which pairs and how far along: where they draw it is resolved with the screens' transforms of
 * this frame, once every screen's styles are (applyBoundsScreenFrames); reading them here, from an
 * interpolator, would make the screens' styles depend on each other's.
 */
const resolveStartChain = (
	tag: string,
	sourceScreenKey: string | null,
	destinationScreenKey: string | null,
): StartPair[] => {
	"worklet";
	const chain: StartPair[] = [];
	if (!sourceScreenKey || !destinationScreenKey) return chain;
	let source = sourceScreenKey;
	let destination = destinationScreenKey;
	for (let depth = 0; depth < MAX_CHAIN_DEPTH; depth++) {
		const next = resolveStartPair(tag, source, destination);
		if (!next) break;
		let seen = false;
		for (const pair of chain) if (pair.pairKey === next.pairKey) seen = true;
		if (seen) break;
		chain.push(next);
		source = next.source;
		destination = next.destination;
	}
	return chain;
};

const resolveStartEnd = (params: {
	id: BoundId;
	previous?: ScreenTransitionState;
	current?: ScreenTransitionState;
	next?: ScreenTransitionState;
	toRect?: Partial<MeasuredDimensions>;
	dimensions: Layout;
	computeOptions: BoundsInternalOptions;
}) => {
	"worklet";

	const entering = !params.next;
	const fullscreen = FULLSCREEN_DIMENSIONS(params.dimensions);

	const isFullscreenTarget = params.computeOptions.target === "fullscreen";
	const hasCustomTarget = typeof params.computeOptions.target === "object";
	const hasTargetOverride = isFullscreenTarget || hasCustomTarget;

	const currentScreenKey = params.current?.route.key;
	const previousScreenKey = params.previous?.route.key;
	const nextScreenKey = params.next?.route.key;
	// The screen that has the card, wherever it is in the route tree (not just this stack's neighbour).
	const sourceMeasurePairKey = resolveScreenPairKey(String(params.id), {
		currentScreenKey,
		previousScreenKey,
		nextScreenKey,
	});

	const resolvedPair = resolveTransitionPair(String(params.id), {
		currentScreenKey,
		previousScreenKey,
		nextScreenKey,
		entering,
	});

	const sourceBounds = resolvedPair.sourceBounds;
	const destinationBounds = resolvedPair.destinationBounds;

	if (!sourceBounds) {
		if (hasTargetOverride && sourceMeasurePairKey) {
			requestSourceMeasure(sourceMeasurePairKey, String(params.id));
		}

		return {
			start: null,
			end: null,
			entering,
			currentScreenKey,
			sourceScreenKey: resolvedPair.sourceScreenKey,
			destinationScreenKey: resolvedPair.destinationScreenKey,
			hasTargetOverride,
			layout: null,
			sourceMeasured: null,
			destinationMeasured: null,
		};
	}

	// When target is overridden, destination element is not required
	if (!hasTargetOverride && !destinationBounds) {
		return {
			start: null,
			end: null,
			entering,
			currentScreenKey,
			sourceScreenKey: resolvedPair.sourceScreenKey,
			destinationScreenKey: resolvedPair.destinationScreenKey,
			hasTargetOverride,
			layout: null,
			sourceMeasured: null,
			destinationMeasured: null,
		};
	}

	const start = sourceBounds;
	let end = destinationBounds ?? fullscreen;

	if (isFullscreenTarget) {
		end = fullscreen;
	}

	const customTarget = params.computeOptions.target;
	if (typeof customTarget === "object") {
		end = customTarget;
	}

	return {
		start,
		end,
		entering,
		currentScreenKey,
		sourceScreenKey: resolvedPair.sourceScreenKey,
		destinationScreenKey: resolvedPair.destinationScreenKey,
		hasTargetOverride,
		// Where this element is laid out: the destination's slot entering, the source's leaving.
		layout: entering ? destinationBounds : sourceBounds,
		sourceMeasured: sourceBounds,
		destinationMeasured: destinationBounds,
	};
};

export const computeBoundStyles = (
	{
		id,
		previous,
		current,
		next,
		progress,
		dimensions,
		interpolationProps,
	}: BoundsComputeParams,
	computeOptions: BoundsInternalOptions = { id: "bound-id" },
) => {
	"worklet";

	if (!id) {
		return NO_STYLES;
	}

	const {
		start,
		end,
		entering,
		currentScreenKey,
		sourceScreenKey,
		destinationScreenKey,
		layout,
		sourceMeasured,
		destinationMeasured,
	} = resolveStartEnd({
		id,
		previous,
		current,
		next,
		computeOptions,
		dimensions,
	});

	if (!start || !end) {
		return NO_STYLES;
	}

	const ranges: readonly [number, number] = entering ? ENTER_RANGE : EXIT_RANGE;

	if (computeOptions.method === "content") {
		const currentOwnsSource =
			!!currentScreenKey &&
			currentScreenKey === sourceScreenKey &&
			currentScreenKey !== destinationScreenKey;
		const contentStart = currentOwnsSource ? end : start;
		const contentEnd = currentOwnsSource ? start : end;
		const geometry = computeContentTransformGeometry({
			start: contentStart,
			end: contentEnd,
			entering,
			dimensions,
			anchor: computeOptions.anchor,
			scaleMode: computeOptions.scaleMode,
		});

		return composeContentStyle({
			start: contentStart,
			progress,
			ranges,
			end: contentEnd,
			geometry,
			computeOptions,
			interpolationProps,
		});
	}

	const isSize = computeOptions.method === "size";
	const isAbsolute = computeOptions.space === "absolute";
	// Styles follow the screens (see bounds-screen-frames): their path is worked out where the screens
	// lay the element out, without the transforms the screens had when measured, and drawn through
	// where the screens are now. Raw values keep the window-space rects their callers compose with.
	const followsScreens = !computeOptions.raw && !isAbsolute;
	const sourceMeasuredWith = (sourceMeasured as MeasuredWith | null)
		?.screenTransform;
	const destinationMeasuredWith = (destinationMeasured as MeasuredWith | null)
		?.screenTransform;
	const pathStart = followsScreens
		? toLayoutSpace(start, sourceMeasuredWith)
		: start;
	const pathEnd =
		followsScreens && end === destinationMeasured
			? toLayoutSpace(end, destinationMeasuredWith)
			: end;
	const ownLayout =
		followsScreens && layout
			? toLayoutSpace(
					layout,
					entering ? destinationMeasuredWith : sourceMeasuredWith,
				)
			: layout;

	const geometry = computeRelativeGeometry({
		start: pathStart,
		end: pathEnd,
		entering,
		anchor: computeOptions.anchor,
		scaleMode: computeOptions.scaleMode,
	});

	const common: ElementComposeParams = {
		start: pathStart,
		end: pathEnd,
		progress,
		ranges,
		geometry,
		computeOptions,
		interpolationProps,
	};

	const style = isSize
		? isAbsolute
			? composeSizeAbsolute(common)
			: composeSizeRelative(common)
		: isAbsolute
			? composeTransformAbsolute(common)
			: composeTransformRelative(common);

	// Raw values are composed by their caller (the navigation helpers move the screen themselves).
	if (computeOptions.raw || isAbsolute) return style;
	const tag = String(id);
	// A pair a newer screen has taken the element from (its destination closing): neither copy draws
	// it any more, the newer one does, from where this pair had it. The source's copy too: its screen
	// may still follow the closing pair for a few frames, and it would draw a second card.
	const taken =
		!!sourceScreenKey &&
		!!destinationScreenKey &&
		(((entering ? currentScreenKey === destinationScreenKey : true) &&
			isTakenByNewerScreen(tag, destinationScreenKey)) ||
			(!entering &&
				currentScreenKey === sourceScreenKey &&
				isMovedOnFrom(tag, destinationScreenKey)));
	const t = Math.min(1, Math.max(0, progress - ranges[0]));
	const startChain = resolveStartChain(
		tag,
		sourceScreenKey,
		destinationScreenKey,
	);
	// A closing pair whose element has landed (isPairLanded). Its destination's copy still draws on top
	// of the source's while its spring settles, long after its screen has gone: once its screen no
	// longer covers the source's copy (applyBoundsScreenFrames), it stops, so the leaving copy's content
	// (scaled, or styled for its own screen) doesn't linger.
	const pairLanded =
		isTeleportAvailable &&
		!!sourceScreenKey &&
		!!destinationScreenKey &&
		isScreenClosing(destinationScreenKey) &&
		t * spanOf(pathStart, pathEnd) < LANDED_PX &&
		// Handoff: the live content is in this slot until it lands home.
		!getEntry(tag, destinationScreenKey)?.handoff;
	// Only escaped copies draw outside their screens: inline (no Teleport), the leaving copy is clipped
	// away with its screen, and the source's copy may not be drawing.
	const landed =
		pairLanded &&
		!taken &&
		entering &&
		currentScreenKey === destinationScreenKey;
	return attachBoundsScreenFrame(taken ? { ...style, opacity: 0 } : style, {
		tag,
		t,
		sourceScreenKey,
		destinationScreenKey,
		screenKey: currentScreenKey,
		layout: ownLayout,
		start: pathStart,
		end: pathEnd,
		startChain,
		landed,
	});
};
