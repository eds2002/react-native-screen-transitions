import { useMemo } from "react";
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
import { useGestureContext } from "../gestures.provider";
import type {
	ScrollGestureAxis,
	ScrollGestureAxisState,
	ScrollGestureState,
} from "../types";
import { updateScrollGestureAxisState } from "./update-scroll-gesture-state";
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

	const { scrollStates, panGestures, pinchGestures, ownerRouteKeys } = useMemo(
		() => walkUpScrollGestureCoordination(context, scrollDirection),
		[context, scrollDirection],
	);

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
		};

		const clearIsTouched = () => {
			"worklet";
			for (const scrollState of scrollStates) {
				modifyScrollGestureAxisState(scrollState, scrollDirection, {
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
	}, [panGestures, pinchGestures, scrollStates, scrollDirection]);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			if (scrollStates.length === 0) return;

			const offset =
				scrollDirection === "horizontal"
					? event.contentOffset.x
					: event.contentOffset.y;

			for (const scrollState of scrollStates) {
				modifyScrollGestureAxisState(scrollState, scrollDirection, {
					offset,
					isTouched: scrollState.get()?.isTouched ?? true,
				});
			}
		},
	});

	const onContentSizeChange = useStableCallback(
		(width: number, height: number) => {
			props.onContentSizeChange?.(width, height);
			if (scrollStates.length === 0) return;

			const contentSize = scrollDirection === "horizontal" ? width : height;

			for (const scrollState of scrollStates) {
				modifyScrollGestureAxisState(scrollState, scrollDirection, {
					contentSize,
				});
			}
		},
	);

	const onLayout = useStableCallback((event: LayoutChangeEvent) => {
		props.onLayout?.(event);
		if (scrollStates.length === 0) return;

		const { width, height } = event.nativeEvent.layout;
		const layoutSize = scrollDirection === "horizontal" ? width : height;

		for (const scrollState of scrollStates) {
			modifyScrollGestureAxisState(scrollState, scrollDirection, {
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
	};
};
