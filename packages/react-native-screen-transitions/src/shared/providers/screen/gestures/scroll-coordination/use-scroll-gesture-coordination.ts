import { useLayoutEffect, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Gesture, type GestureType } from "react-native-gesture-handler";
import {
	type SharedValue,
	useAnimatedScrollHandler,
	useDerivedValue,
} from "react-native-reanimated";
import { useSharedValueState } from "../../../../hooks/reanimated/use-shared-value-state";
import useStableCallback from "../../../../hooks/use-stable-callback";
import { AnimationStore } from "../../../../stores/animation.store";
import { ScrollStore } from "../../../../stores/scroll.store";
import { useGestureContext } from "../gestures.provider";
import type {
	ScrollGestureAxis,
	ScrollGestureAxisState,
	ScrollGestureState,
	ScrollMetadataState,
} from "../types";
import {
	useScrollMetadataOwnerContext,
	useScrollMetadataOwnerProviderValue,
} from "./scroll-metadata-owner";
import {
	clearScrollMetadataAxisState,
	updateScrollGestureAxisState,
	updateScrollMetadataAxisState,
} from "./update-scroll-gesture-state";
import { walkUpScrollGestureCoordination } from "./walk-up-scroll-gesture-coordination";

interface ScrollGestureCoordinationProps {
	onContentSizeChange?: (width: number, height: number) => void;
	onLayout?: (event: LayoutChangeEvent) => void;
	direction?: ScrollGestureAxis;
}

type ScrollGesturePatch = Partial<ScrollGestureAxisState> & {
	isTouched?: boolean;
};

const modifyScrollGestureAxisState = (
	scrollState: SharedValue<ScrollGestureState | null>,
	axis: ScrollGestureAxis,
	patch: ScrollGesturePatch,
) => {
	"worklet";

	scrollState.modify(<T extends ScrollGestureState | null>(state: T): T => {
		"worklet";
		return updateScrollGestureAxisState(state, axis, patch) as T;
	});
};

const modifyScrollMetadataAxisState = (
	scrollState: SharedValue<ScrollMetadataState | null>,
	axis: ScrollGestureAxis,
	patch: ScrollGesturePatch,
) => {
	"worklet";

	scrollState.modify(<T extends ScrollMetadataState | null>(state: T): T => {
		"worklet";
		return updateScrollMetadataAxisState(state, axis, patch) as T;
	});
};

const clearScrollMetadataAxis = (
	scrollState: SharedValue<ScrollMetadataState | null>,
	axis: ScrollGestureAxis,
) => {
	"worklet";

	scrollState.modify(<T extends ScrollMetadataState | null>(state: T): T => {
		"worklet";
		return clearScrollMetadataAxisState(state, axis) as T;
	});
};

/**
 * Returns scroll handlers and a native gesture for ScrollView coordination.
 *
 * Finds ALL gesture owners for the scroll axis (both directions) and coordinates
 * with each of them. This ensures that:
 * - A screen claiming `vertical-inverted` can handle swipe-up at bottom boundary
 * - An ancestor claiming `vertical` can handle swipe-down at top boundary
 * - Both work correctly with the same ScrollView
 */
export const useScrollGestureCoordination = (
	props: ScrollGestureCoordinationProps,
) => {
	const context = useGestureContext();
	const scrollDirection = props.direction ?? "vertical";

	const metadataOwnerContext = useScrollMetadataOwnerContext();
	const metadataOwnerProviderValue =
		useScrollMetadataOwnerProviderValue(scrollDirection);
	const isFirstMetadataWriterInTree = !metadataOwnerContext[scrollDirection];
	const [metadataWriterId] = useState(() =>
		ScrollStore.createMetadataWriterId(),
	);
	const [writesMetadata, setWritesMetadata] = useState(false);

	const { scrollStates, panGestures, pinchGestures, ownerRouteKeys } = useMemo(
		() => walkUpScrollGestureCoordination(context, scrollDirection),
		[context, scrollDirection],
	);

	const routeKey = context?.routeKey;
	const metadataState = useMemo(
		() => (routeKey ? ScrollStore.getValue(routeKey, "metadata") : null),
		[routeKey],
	);

	useLayoutEffect(() => {
		if (!routeKey || !isFirstMetadataWriterInTree) {
			setWritesMetadata(false);
			return;
		}

		const claimed = ScrollStore.claimMetadataWriter(
			routeKey,
			scrollDirection,
			metadataWriterId,
		);
		setWritesMetadata(claimed);

		return () => {
			const released = ScrollStore.releaseMetadataWriter(
				routeKey,
				scrollDirection,
				metadataWriterId,
			);

			if (!released || !metadataState) return;

			if (!ScrollStore.hasMetadataWriters(routeKey)) {
				metadataState.set(null);
				return;
			}

			clearScrollMetadataAxis(metadataState, scrollDirection);
		};
	}, [
		routeKey,
		scrollDirection,
		isFirstMetadataWriterInTree,
		metadataState,
		metadataWriterId,
	]);

	const ownerClosingValues = useMemo(
		() =>
			ownerRouteKeys.map((routeKey) =>
				AnimationStore.getValue(routeKey, "closing"),
			),
		[ownerRouteKeys],
	);

	const scrollEventsEnabled = useSharedValueState(
		useDerivedValue(() => {
			"worklet";
			for (let i = 0; i < ownerClosingValues.length; i++) {
				if (ownerClosingValues[i].get()) {
					return false;
				}
			}

			return true;
		}),
	);

	const nativeGesture = useMemo(() => {
		if (panGestures.length === 0 && pinchGestures.length === 0) return null;

		const setIsTouched = () => {
			"worklet";
			for (const scrollState of scrollStates) {
				modifyScrollGestureAxisState(scrollState, scrollDirection, {
					isTouched: true,
				});
			}

			if (writesMetadata && metadataState) {
				modifyScrollMetadataAxisState(metadataState, scrollDirection, {
					isTouched: true,
				});
			}
		};

		const clearIsTouched = () => {
			"worklet";
			for (const scrollState of scrollStates) {
				modifyScrollGestureAxisState(scrollState, scrollDirection, {
					isTouched: false,
				});
			}

			if (writesMetadata && metadataState) {
				modifyScrollMetadataAxisState(metadataState, scrollDirection, {
					isTouched: false,
				});
			}
		};

		let gesture = Gesture.Native()
			.onTouchesDown(setIsTouched)
			.onTouchesUp(clearIsTouched)
			.onTouchesCancelled(clearIsTouched);

		for (const panGesture of panGestures) {
			gesture = gesture.requireExternalGestureToFail({
				current: panGesture as unknown as GestureType,
			});
		}

		for (const pinchGesture of pinchGestures) {
			gesture = gesture.requireExternalGestureToFail({
				current: pinchGesture as unknown as GestureType,
			});
		}

		return gesture;
	}, [
		panGestures,
		pinchGestures,
		scrollStates,
		scrollDirection,
		writesMetadata,
		metadataState,
	]);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			const offset =
				scrollDirection === "horizontal"
					? event.contentOffset.x
					: event.contentOffset.y;

			for (const scrollState of scrollStates) {
				modifyScrollGestureAxisState(scrollState, scrollDirection, {
					offset,
					isTouched: scrollState.get()?.[scrollDirection].isTouched ?? true,
				});
			}

			if (writesMetadata && metadataState) {
				modifyScrollMetadataAxisState(metadataState, scrollDirection, {
					offset,
					isTouched: metadataState.get()?.[scrollDirection]?.isTouched ?? true,
				});
			}
		},
	});

	const onContentSizeChange = useStableCallback(
		(width: number, height: number) => {
			props.onContentSizeChange?.(width, height);

			const contentSize = scrollDirection === "horizontal" ? width : height;

			for (const scrollState of scrollStates) {
				modifyScrollGestureAxisState(scrollState, scrollDirection, {
					contentSize,
				});
			}

			if (writesMetadata && metadataState) {
				modifyScrollMetadataAxisState(metadataState, scrollDirection, {
					contentSize,
				});
			}
		},
	);

	const onLayout = useStableCallback((event: LayoutChangeEvent) => {
		props.onLayout?.(event);

		const { width, height } = event.nativeEvent.layout;
		const layoutSize = scrollDirection === "horizontal" ? width : height;

		for (const scrollState of scrollStates) {
			modifyScrollGestureAxisState(scrollState, scrollDirection, {
				layoutSize,
			});
		}

		if (writesMetadata && metadataState) {
			modifyScrollMetadataAxisState(metadataState, scrollDirection, {
				layoutSize,
			});
		}
	});

	return {
		scrollHandler,
		scrollEventsEnabled,
		onContentSizeChange,
		onLayout,
		nativeGesture,
		metadataOwnerProviderValue,
	};
};
