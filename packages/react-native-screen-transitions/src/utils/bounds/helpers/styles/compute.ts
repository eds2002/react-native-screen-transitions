import type { MeasuredDimensions } from "react-native-reanimated";
import {
	ENTER_RANGE,
	EXIT_RANGE,
	FULLSCREEN_DIMENSIONS,
	NO_STYLES,
} from "../../../../constants";
import {
	getScreenProgress,
	isScreenClosing,
} from "../../../../providers/motion/helpers/progress-registry";
import {
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
import type { ResolvedTransitionPair } from "../../../../stores/bounds/types";
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
import { attachBoundsLocalTransform } from "./local-transform";

const lerp = (a: number, b: number, t: number) => {
	"worklet";
	return a + (b - a) * t;
};

/**
 * Handed-off content passed along a chain (List -> Detail -> Theater) lives in one place. While the
 * middle screen is itself moving (Theater closing while Detail closes too, or Theater pushed while
 * Detail still opens), the slot the content goes back to is not at rest: it is wherever Detail's
 * own pair has it now. Aiming there keeps both hops one motion; aiming at the resting slot lands
 * the content there and then jumps onto Detail's pair, already part way along.
 */
const lerpRect = (
	from: MeasuredDimensions,
	to: MeasuredDimensions,
	t: number,
): MeasuredDimensions => {
	"worklet";
	return {
		x: lerp(from.x, to.x, t),
		y: lerp(from.y, to.y, t),
		width: lerp(from.width, to.width, t),
		height: lerp(from.height, to.height, t),
		pageX: lerp(from.pageX, to.pageX, t),
		pageY: lerp(from.pageY, to.pageY, t),
	};
};

/**
 * Handed-off content still in flight to another screen pushed from the same source, now closing (a
 * push, a pop and a push again, quickly): the newer screen takes the content where it is in that
 * close, not from its resting slot. The furthest-open one is where it is shown.
 */
const resolveInFlightSibling = (
	tag: string,
	sourceScreenKey: string,
	destinationScreenKey: string | null,
): MeasuredDimensions | null => {
	"worklet";
	const state = pairs.get();
	let best: MeasuredDimensions | null = null;
	let bestProgress = 0;
	for (const pairKey in state) {
		if (getSourceScreenKeyFromPairKey(pairKey) !== sourceScreenKey) continue;
		const destination = getDestinationScreenKeyFromPairKey(pairKey);
		if (!destination || destination === destinationScreenKey) continue;
		if (!isScreenClosing(destination)) continue;
		const t = getScreenProgress(destination);
		if (t === undefined || t <= 0 || t >= 1 || t <= bestProgress) continue;
		const link = getResolvedLink(pairKey, tag).link;
		const from = link?.source?.bounds;
		const to = link?.destination?.bounds;
		if (!from || !to) continue;
		best = lerpRect(from, to, t);
		bestProgress = t;
	}
	return best;
};

const resolveMovingHandoffSource = (
	tag: string,
	sourceBounds: MeasuredDimensions,
	sourceScreenKey: string | null,
	destinationScreenKey: string | null,
): MeasuredDimensions => {
	"worklet";
	if (!sourceScreenKey) return sourceBounds;
	if (getEntry(tag, sourceScreenKey)?.handoff) {
		const sibling = resolveInFlightSibling(
			tag,
			sourceScreenKey,
			destinationScreenKey,
		);
		if (sibling) return sibling;
	}
	const t = getScreenProgress(sourceScreenKey);
	if (t === undefined || t === 1 || !getEntry(tag, sourceScreenKey)?.handoff) {
		return sourceBounds;
	}
	const upstream = resolveTransitionPair(tag, {
		currentScreenKey: sourceScreenKey,
		entering: true,
	});
	const from = upstream.sourceBounds;
	const to = upstream.destinationBounds;
	if (!from || !to || upstream.destinationScreenKey !== sourceScreenKey) {
		return sourceBounds;
	}
	return lerpRect(from, to, t);
};

const resolveStartEnd = (params: {
	id: BoundId;
	previous?: ScreenTransitionState;
	current?: ScreenTransitionState;
	next?: ScreenTransitionState;
	toRect?: Partial<MeasuredDimensions>;
	dimensions: Layout;
	computeOptions: BoundsInternalOptions;
	resolvedPair?: ResolvedTransitionPair;
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

	const resolvedPair =
		params.resolvedPair ??
		resolveTransitionPair(String(params.id), {
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
		};
	}

	const start = entering
		? resolveMovingHandoffSource(
				String(params.id),
				sourceBounds,
				resolvedPair.sourceScreenKey,
				resolvedPair.destinationScreenKey,
			)
		: sourceBounds;
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
	resolvedPair?: ResolvedTransitionPair,
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
	} = resolveStartEnd({
		id,
		previous,
		current,
		next,
		computeOptions,
		dimensions,
		resolvedPair,
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

	const geometry = computeRelativeGeometry({
		start,
		end,
		entering,
		anchor: computeOptions.anchor,
		scaleMode: computeOptions.scaleMode,
	});

	const common: ElementComposeParams = {
		start,
		end,
		progress,
		ranges,
		geometry,
		computeOptions,
		interpolationProps,
	};

	const isSize = computeOptions.method === "size";
	const isAbsolute = computeOptions.space === "absolute";

	const style = isSize
		? isAbsolute
			? composeSizeAbsolute(common)
			: composeSizeRelative(common)
		: isAbsolute
			? composeTransformAbsolute(common)
			: composeTransformRelative(common);

	return attachBoundsLocalTransform(
		style,
		entering
			? (resolvedPair?.destinationStyles ?? null)
			: (resolvedPair?.sourceStyles ?? null),
	);
};
