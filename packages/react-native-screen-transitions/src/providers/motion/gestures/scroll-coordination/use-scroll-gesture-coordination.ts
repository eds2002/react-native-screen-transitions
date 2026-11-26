import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Gesture, type GestureType } from "react-native-gesture-handler";
import {
	type SharedValue,
	useAnimatedScrollHandler,
	useDerivedValue,
} from "react-native-reanimated";
import { useSharedValueState } from "../../../../hooks/reanimated/use-shared-value-state";
import useStableCallback from "../../../../hooks/use-stable-callback";
import { ScrollStore } from "../../../../stores/scroll.store";
import { useIsPreloadedScene } from "../../../preloaded-scene-context";
import { useMotionStore, useOptionalMotionStore } from "../..";
import { useGestureScrollCoordination } from "../ownership/use-gesture-scroll-coordination";
import type {
	ScrollGestureAxis,
	ScrollGestureAxisState,
	ScrollGestureState,
	ScrollMetadataState,
} from "../types";
import {
	useOptionalScrollMetadataOwnerStore,
	useScrollMetadataOwnerProviderValue,
} from "./scroll-metadata-owner";
import {
	clearScrollMetadataAxisState,
	updateScrollGestureAxisState,
	updateScrollMetadataAxisState,
} from "./update-scroll-gesture-state";

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
	const context = useOptionalMotionStore((store) => store?.gestures ?? null);
	const scrollDirection = props.direction ?? "vertical";
	const routeKey = context?.routeKey ?? null;
	const preloaded = useIsPreloadedScene();
	const activeRouteKey = preloaded ? null : routeKey;
	const { scrollStates, panGestures, pinchGestures, ownerRouteKeys } =
		useGestureScrollCoordination(activeRouteKey, scrollDirection);

	const metadataOwnerContext = useOptionalScrollMetadataOwnerStore();
	const metadataOwnerProviderValue =
		useScrollMetadataOwnerProviderValue(scrollDirection);
	const isFirstMetadataWriterInTree = !metadataOwnerContext?.[scrollDirection];
	const [metadataWriterId] = useState(() =>
		ScrollStore.createMetadataWriterId(),
	);
	const [writesMetadata, setWritesMetadata] = useState(false);

	const metadataState = useMemo(
		() =>
			activeRouteKey ? ScrollStore.getValue(activeRouteKey, "metadata") : null,
		[activeRouteKey],
	);

	useLayoutEffect(() => {
		if (!activeRouteKey || !isFirstMetadataWriterInTree) {
			setWritesMetadata(false);
			return;
		}

		const claimed = ScrollStore.claimMetadataWriter(
			activeRouteKey,
			scrollDirection,
			metadataWriterId,
		);
		setWritesMetadata(claimed);

		return () => {
			const released = ScrollStore.releaseMetadataWriter(
				activeRouteKey,
				scrollDirection,
				metadataWriterId,
			);

			if (!released || !metadataState) return;

			if (!ScrollStore.hasMetadataWriters(activeRouteKey)) {
				metadataState.set(null);
				return;
			}

			clearScrollMetadataAxis(metadataState, scrollDirection);
		};
	}, [
		activeRouteKey,
		scrollDirection,
		isFirstMetadataWriterInTree,
		metadataState,
		metadataWriterId,
	]);

	const ownerMotions = useMotionStore(ownerRouteKeys);
	const ownerClosingValues = useMemo(
		() =>
			ownerMotions.flatMap((motion) => (motion ? [motion.state.closing] : [])),
		[ownerMotions],
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
		// Ownership registrations disappear while a screen's Activity is paused.
		// Keep its detector mounted through that gap: removing the wrapper remounts
		// scroll children and loses state, including captured boundary measurements.
		if (!routeKey) return null;

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
			.enabled(!preloaded)
			.onTouchesDown(setIsTouched)
			.onTouchesUp(clearIsTouched)
			.onTouchesCancelled(clearIsTouched);

		for (const panGesture of panGestures) {
			gesture = gesture.requireExternalGestureToFail({
				current: panGesture as unknown as GestureType,
			});
		}

		for (const pinchGesture of pinchGestures) {
			// A pinch must remain possible after the first finger lands. Making
			// native scrolling wait for it to fail therefore stalls ordinary
			// one-finger scrolling until touch-up. Let both recognizers run:
			// the ScrollView can begin immediately, while a second finger can
			// still promote the screen gesture to a pinch.
			gesture = gesture.simultaneousWithExternalGesture({
				current: pinchGesture as unknown as GestureType,
			});
		}

		return gesture;
	}, [
		routeKey,
		panGestures,
		pinchGestures,
		scrollStates,
		scrollDirection,
		writesMetadata,
		metadataState,
		preloaded,
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

	const preloadedLayout = useRef<ScrollGesturePatch | null>(null);
	const publishLayout = useCallback(
		(patch: ScrollGesturePatch) => {
			if (preloaded || preloadedLayout.current) {
				preloadedLayout.current = { ...preloadedLayout.current, ...patch };
			}
			for (const scrollState of scrollStates) {
				modifyScrollGestureAxisState(scrollState, scrollDirection, patch);
			}
			if (writesMetadata && metadataState) {
				modifyScrollMetadataAxisState(metadataState, scrollDirection, patch);
			}
		},
		[metadataState, preloaded, scrollDirection, scrollStates, writesMetadata],
	);

	useLayoutEffect(() => {
		// Promotion can install owners without a new native layout event.
		if (!preloaded && preloadedLayout.current) {
			publishLayout(preloadedLayout.current);
		}
	}, [preloaded, publishLayout]);

	const onContentSizeChange = useStableCallback(
		(width: number, height: number) => {
			props.onContentSizeChange?.(width, height);

			const contentSize = scrollDirection === "horizontal" ? width : height;
			publishLayout({ contentSize });
		},
	);

	const onLayout = useStableCallback((event: LayoutChangeEvent) => {
		props.onLayout?.(event);

		const { width, height } = event.nativeEvent.layout;
		const layoutSize = scrollDirection === "horizontal" ? width : height;
		publishLayout({ layoutSize });
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
