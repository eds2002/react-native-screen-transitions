import {
	cancelAnimation,
	makeMutable,
	type SharedValue,
} from "react-native-reanimated";
import type {
	ScrollGestureAxis,
	ScrollGestureState,
	ScrollMetadataState,
} from "../types/gesture.types";
import type { ScreenKey } from "../types/screen.types";
import { createStore } from "../utils/create-store";

export type ScrollStoreMap = {
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
 * Route-keyed scroll geometry used by gesture activation and bounds measurement.
 * Coordination tracks gesture-owner scoped ScrollView offsets and dimensions;
 * metadata tracks screen-scoped scroll values exposed to animation consumers.
 */
const scrollStore = createStore<ScrollStoreMap>({
	createBag: () => ({
		coordination: makeMutable<ScrollGestureState | null>(null),
		metadata: makeMutable<ScrollMetadataState | null>(null),
	}),
	disposeBag: (bag) => {
		cancelAnimation(bag.coordination);
		cancelAnimation(bag.metadata);
	},
});

export const ScrollStore = {
	...scrollStore,
	createMetadataWriterId,
	claimMetadataWriter,
	releaseMetadataWriter,
	hasMetadataWriters,
	clearBag(routeKey: ScreenKey) {
		clearMetadataWriters(routeKey);
		scrollStore.clearBag(routeKey);
	},
};
