import type { MeasuredDimensions } from "react-native-reanimated";
import { isTeleportAvailable } from "../../../../components/boundary/portal/teleport";
import {
	getScreenMountOrder,
	getScreenProgress,
	isScreenClosing,
	isScreenNewer,
} from "../../../../providers/motion/helpers/progress-registry";
import {
	createScreenPairKey,
	getDestinationScreenKeyFromPairKey,
	getEntry,
	getResolvedLink,
	getSourceScreenKeyFromPairKey,
	pairs,
	resolveTransitionPair,
} from "../../../../stores/bounds";
import type { StartPair } from "./screen-frame";

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

type LandingLinks = Record<
	string,
	| {
			source?: { bounds?: MeasuredDimensions | null } | null;
			destination?: {
				bounds?: MeasuredDimensions | null;
				handoff?: boolean;
			} | null;
	  }
	| undefined
>;

/**
 * Whether a closing pair's handoff content has landed home: every handoff element is within
 * LANDED_PX of its source slot at `t` (the destination's progress, its spring's tail). The content
 * goes back to its source's receiver then (resolveBoundaryReceiver), not when the spring settles
 * long after: its screen is all but gone, and the content still in it would take touches meant for
 * the screen it lands in (a swipe starting on it grabbed the leaving screen) and keep that screen's
 * drawing of it until the end.
 */
export const isHandoffLanded = (links: LandingLinks, t: number): boolean => {
	"worklet";
	let found = false;
	for (const key in links) {
		const link = links[key];
		if (!link?.destination?.handoff) continue;
		const from = link.source?.bounds;
		const to = link.destination.bounds;
		if (!from || !to || t * spanOf(from, to) >= LANDED_PX) return false;
		found = true;
	}
	return found;
};

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
 * Whether a newer pair carries the element on from `screenKey`: one whose destination is newer
 * than `screenKey`, is moving (above zero) and has the element, unless it has landed. `fromScreen`
 * only counts pairs that start at `screenKey` itself.
 */
const isCarriedOnByNewerPair = (
	tag: string,
	screenKey: string,
	fromScreen: boolean,
): boolean => {
	"worklet";
	const state = pairs.get();
	for (const pairKey in state) {
		if (fromScreen && getSourceScreenKeyFromPairKey(pairKey) !== screenKey)
			continue;
		const destination = getDestinationScreenKeyFromPairKey(pairKey);
		if (!destination || destination === screenKey) continue;
		if (!isScreenNewer(destination, screenKey)) continue;
		const t = getScreenProgress(destination);
		if (t === undefined || t <= 0) continue;
		if (isPairLanded(pairKey, tag, destination)) continue;
		if (getResolvedLink(pairKey, tag).link?.destination?.bounds) return true;
	}
	return false;
};

/**
 * A closing screen whose element a newer screen has taken (see resolveClosingPresenter) no longer
 * draws it: the newer one does, from where this one had it. A newer pair that has landed doesn't.
 */
const isTakenByNewerScreen = (tag: string, destinationScreenKey: string) => {
	"worklet";
	return (
		isScreenClosing(destinationScreenKey) &&
		isCarriedOnByNewerPair(tag, destinationScreenKey, false)
	);
};

/**
 * Whether the element of a pair into `destinationScreenKey` has moved on: a newer screen pushed on
 * top of the destination opened its own pair from it (a chain pushed while the first pair still
 * opens). The source's copy of the first pair stops drawing: the destination's copy carries the
 * element on, from where it is drawn (resolveStartChain). Seen through a translucent destination,
 * the source's copy would otherwise keep heading for the destination's slot: a second card.
 */
const isMovedOnFrom = (tag: string, destinationScreenKey: string) => {
	"worklet";
	return isCarriedOnByNewerPair(tag, destinationScreenKey, true);
};

/**
 * Whether the source screen of a closing pair draws its handoff elements' copies now: it isn't
 * closing itself, and no newer screen holds the elements (taken from the destination, or carried on
 * from it while a newer pair is mounted). Only then can landed content go home before the pair's
 * close ends (see isHandoffLanded): sent home earlier, it is drawn by a copy that is hidden.
 */
export const isHandoffHomeDrawn = (
	pairKey: string,
	links: LandingLinks,
): boolean => {
	"worklet";
	const source = getSourceScreenKeyFromPairKey(pairKey);
	const destination = getDestinationScreenKeyFromPairKey(pairKey);
	if (!source || !destination || isScreenClosing(source)) return false;
	for (const key in links) {
		if (!links[key]?.destination?.handoff) continue;
		if (
			isTakenByNewerScreen(key, destination) ||
			isMovedOnFrom(key, destination)
		)
			return false;
	}
	return true;
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

/**
 * How a bounds element's pair stands among the transitions overlapping it this frame:
 * - taken: a newer screen has taken the element from this pair (its destination closing), or, for
 *   the source's copy, a newer pair carries it on from the destination: neither copy draws it, the
 *   newer one does, from where this pair had it (the source's screen may still follow the closing
 *   pair for a few frames, and would draw a second card);
 * - startChain: the pairs it starts from when it is not at its source slot (resolveStartChain);
 * - landed: this closing pair's element has landed and this is its destination's copy. That copy
 *   still draws on top of the source's while its spring settles, long after its screen has gone:
 *   once its screen no longer covers the source's copy (applyBoundsScreenFrames), it stops, so the
 *   leaving copy's content (scaled, or styled for its own screen) doesn't linger. Only escaped
 *   copies draw outside their screens: inline (no Teleport) the leaving copy is clipped away with
 *   its screen. Never for handoff: the live content is in the destination's slot until it lands.
 */
export const resolveOverlap = ({
	tag,
	entering,
	currentScreenKey,
	sourceScreenKey,
	destinationScreenKey,
	t,
	pathStart,
	pathEnd,
}: {
	tag: string;
	entering: boolean;
	currentScreenKey: string | undefined;
	sourceScreenKey: string | null;
	destinationScreenKey: string | null;
	/** How far along its path the element is (0 at the source). */
	t: number;
	pathStart: MeasuredDimensions;
	pathEnd: MeasuredDimensions;
}): { taken: boolean; landed: boolean; startChain: StartPair[] } => {
	"worklet";
	if (!sourceScreenKey || !destinationScreenKey) {
		return { taken: false, landed: false, startChain: [] };
	}
	const taken =
		((!entering || currentScreenKey === destinationScreenKey) &&
			isTakenByNewerScreen(tag, destinationScreenKey)) ||
		(!entering &&
			currentScreenKey === sourceScreenKey &&
			isMovedOnFrom(tag, destinationScreenKey));
	const landed =
		!taken &&
		entering &&
		currentScreenKey === destinationScreenKey &&
		isTeleportAvailable &&
		isScreenClosing(destinationScreenKey) &&
		t * spanOf(pathStart, pathEnd) < LANDED_PX &&
		!getEntry(tag, destinationScreenKey)?.handoff;
	return {
		taken,
		landed,
		startChain: resolveStartChain(tag, sourceScreenKey, destinationScreenKey),
	};
};
