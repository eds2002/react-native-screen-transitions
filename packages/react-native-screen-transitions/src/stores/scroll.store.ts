import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import type { MeasuredBounds } from "../types/bounds.types";
import type {
	ScrollChainSnapshot,
	ScrollGestureAxis,
	ScrollGestureAxisState,
	ScrollGestureState,
	ScrollMetadataState,
} from "../types/gesture.types";
import type { ScreenKey } from "../types/screen.types";

type ScrollStoreMap = {
	coordination: SharedValue<ScrollGestureState | null>;
	metadata: SharedValue<ScrollMetadataState | null>;
};

const metadataWriters: Record<
	ScreenKey,
	Partial<Record<ScrollGestureAxis, string>>
> = {};

let nextMetadataWriterId = 0;

const createMetadataWriterId = () => {
	nextMetadataWriterId += 1;
	return `scroll-metadata-${nextMetadataWriterId}`;
};

const claimMetadataWriter = (
	routeKey: ScreenKey,
	axis: ScrollGestureAxis,
	writerId: string,
): boolean => {
	const writers = metadataWriters[routeKey] ?? {};
	metadataWriters[routeKey] = writers;

	if (!writers[axis]) {
		writers[axis] = writerId;
	}

	return writers[axis] === writerId;
};

const releaseMetadataWriter = (
	routeKey: ScreenKey,
	axis: ScrollGestureAxis,
	writerId: string,
): boolean => {
	const writers = metadataWriters[routeKey];
	if (!writers || writers[axis] !== writerId) return false;

	delete writers[axis];

	if (!writers.vertical && !writers.horizontal) {
		delete metadataWriters[routeKey];
	}

	return true;
};

const hasMetadataWriters = (routeKey: ScreenKey): boolean => {
	const writers = metadataWriters[routeKey];
	return Boolean(writers?.vertical || writers?.horizontal);
};

const clearMetadataWriters = (routeKey: ScreenKey) => {
	delete metadataWriters[routeKey];
};

export const cloneScrollMetadataState = (
	scroll: ScrollMetadataState | null | undefined,
): ScrollMetadataState | null => {
	"worklet";

	if (!scroll) {
		return null;
	}

	return {
		vertical: scroll.vertical
			? {
					offset: scroll.vertical.offset,
					contentSize: scroll.vertical.contentSize,
					layoutSize: scroll.vertical.layoutSize,
					isTouched: scroll.vertical.isTouched,
				}
			: null,
		horizontal: scroll.horizontal
			? {
					offset: scroll.horizontal.offset,
					contentSize: scroll.horizontal.contentSize,
					layoutSize: scroll.horizontal.layoutSize,
					isTouched: scroll.horizontal.isTouched,
				}
			: null,
	};
};

/**
 * Offset clamped to the axis layout range, so iOS rubber-band overscroll never
 * leaks into coordinate-space deltas. Returns null when the axis is untracked.
 */
export const clampScrollAxisOffset = (
	axisState: ScrollGestureAxisState | null | undefined,
): number | null => {
	"worklet";

	if (!axisState) {
		return null;
	}

	const maxOffset = Math.max(0, axisState.contentSize - axisState.layoutSize);
	return Math.min(Math.max(axisState.offset, 0), maxOffset);
};

/**
 * Visual scroll travel from a bounds snapshot normalized to its at-rest
 * position. The captured side is clamped because measurement removes transient
 * rubber-band displacement; the current side stays raw so consumers can follow
 * the position that is actually visible on iOS.
 */
const getVisualScrollAxisDelta = (
	current: ScrollMetadataState | null | undefined,
	captured: ScrollMetadataState | null | undefined,
	axis: ScrollGestureAxis,
): number => {
	"worklet";

	const currentAxisState = current?.[axis];
	const capturedOffset = clampScrollAxisOffset(captured?.[axis]);

	if (!currentAxisState || capturedOffset === null) {
		return 0;
	}

	return currentAxisState.offset - capturedOffset;
};

/**
 * Offsets of the scrollables around a view (outermost first), clamped like a measurement: the
 * scrollables are looked up by id in the screen's scroll metadata. A scrollable that has not
 * reported yet is left out, so nothing is corrected against it.
 */
export const snapshotScrollChain = (
	scroll: ScrollMetadataState | null | undefined,
	chain: readonly { id: string; axis: ScrollGestureAxis }[],
): ScrollChainSnapshot[] => {
	"worklet";

	const snapshot: ScrollChainSnapshot[] = [];
	for (let i = 0; i < chain.length; i++) {
		const link = chain[i];
		const offset = clampScrollAxisOffset(scroll?.views?.[link.id]);
		if (offset === null) continue;
		snapshot.push({ id: link.id, axis: link.axis, offset });
	}
	return snapshot;
};

/**
 * How far the scrollables around a view have scrolled along `axis` since `snapshot`, summed over
 * every level of nesting. The live side stays raw, so iOS rubber-banding is followed as drawn.
 */
export const getScrollChainAxisDelta = (
	current: ScrollMetadataState | null | undefined,
	snapshot: readonly ScrollChainSnapshot[],
	axis: ScrollGestureAxis,
): number => {
	"worklet";

	let delta = 0;
	for (let i = 0; i < snapshot.length; i++) {
		const link = snapshot[i];
		if (link.axis !== axis) continue;
		const view = current?.views?.[link.id];
		if (!view) continue;
		delta += view.offset - link.offset;
	}
	return delta;
};

/**
 * How far a measured view has scrolled along `axis` since it was measured: through every scrollable
 * around it when the measurement recorded them (`scrollChain`), else by the screen's own scroll.
 */
export const getMeasuredScrollAxisDelta = (
	current: ScrollMetadataState | null | undefined,
	measured: Pick<MeasuredBounds, "scroll" | "scrollChain">,
	axis: ScrollGestureAxis,
): number => {
	"worklet";
	return measured.scrollChain
		? getScrollChainAxisDelta(current, measured.scrollChain, axis)
		: getVisualScrollAxisDelta(current, measured.scroll, axis);
};

/**
 * Route-keyed scroll geometry used by gesture activation and bounds measurement.
 * Coordination tracks gesture-owner scoped ScrollView offsets and dimensions;
 * metadata tracks screen-scoped scroll values exposed to animation consumers.
 */
const bags: Record<ScreenKey, ScrollStoreMap> = {};

const getValue = <K extends keyof ScrollStoreMap>(
	routeKey: ScreenKey,
	key: K,
): ScrollStoreMap[K] => {
	let bag = bags[routeKey];
	if (!bag) {
		bag = {
			coordination: makeMutable<ScrollGestureState | null>(null),
			metadata: makeMutable<ScrollMetadataState | null>(null),
		};
		bags[routeKey] = bag;
	}
	return bag[key];
};

export const ScrollStore = {
	getValue,
	createMetadataWriterId,
	claimMetadataWriter,
	releaseMetadataWriter,
	hasMetadataWriters,
	clearBag(routeKey: ScreenKey) {
		clearMetadataWriters(routeKey);
		const bag = bags[routeKey];
		if (bag) {
			cancelAnimation(bag.coordination);
			cancelAnimation(bag.metadata);
		}
		delete bags[routeKey];
	},
};
