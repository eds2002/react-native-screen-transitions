import { useMemo } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Gesture, type GestureType } from "react-native-gesture-handler";
import { useAnimatedScrollHandler } from "react-native-reanimated";
import useStableCallback from "../../../../../hooks/use-stable-callback";
import { useGestureContext } from "../../gestures.provider";
import type { ScrollGestureAxis } from "../../types";
import { updateScrollGestureAxisState } from "./update-scroll-gesture-state";
import { walkUpScrollGestureCoordination } from "./walk-up-scroll-gesture-coordination";

interface ScrollProgressHookProps {
	onContentSizeChange?: (width: number, height: number) => void;
	onLayout?: (event: LayoutChangeEvent) => void;
	direction?: ScrollGestureAxis;
}

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
	props: ScrollProgressHookProps,
) => {
	const context = useGestureContext();
	const scrollDirection = props.direction ?? "vertical";

	const { scrollStates, panGestures } = useMemo(() => {
		return walkUpScrollGestureCoordination(context, scrollDirection);
	}, [context, scrollDirection]);

	/**
	 * Intentionally stays on the legacy builder `Gesture.Native()` path.
	 *
	 * After migrating screen gestures to RNGH v3 hooks, the equivalent
	 * `useNativeGesture({ requireToFail })` relation regressed for wrapped
	 * `Transition.ScrollView` components: the scroll view would keep winning at
	 * the boundary instead of yielding to the screen pan gesture.
	 *
	 * The builder-based native gesture below still matches the working
	 * `release/v3.4` behavior, so we keep this one seam on the old API until the
	 * v3 native gesture path behaves equivalently in our wrapper architecture.
	 */
	const nativeGesture = useMemo(() => {
		if (panGestures.length === 0 || scrollStates.length === 0) return null;

		const setIsTouched = () => {
			"worklet";
			for (const scrollState of scrollStates) {
				scrollState.modify((state) => {
					"worklet";
					return updateScrollGestureAxisState(state, scrollDirection, {
						isTouched: true,
					});
				});
			}
		};

		const clearIsTouched = () => {
			"worklet";
			for (const scrollState of scrollStates) {
				scrollState.modify((state) => {
					"worklet";
					return updateScrollGestureAxisState(state, scrollDirection, {
						isTouched: false,
					});
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

		return gesture;
	}, [panGestures, scrollStates, scrollDirection]);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			if (scrollStates.length === 0) return;

			const offset =
				scrollDirection === "horizontal"
					? event.contentOffset.x
					: event.contentOffset.y;

			for (const scrollState of scrollStates) {
				scrollState.modify((state) => {
					"worklet";
					return updateScrollGestureAxisState(state, scrollDirection, {
						offset,
						isTouched: state?.isTouched ?? true,
					});
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
				scrollState.modify((state) => {
					"worklet";
					return updateScrollGestureAxisState(state, scrollDirection, {
						contentSize,
					});
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
			scrollState.modify((state) => {
				"worklet";
				return updateScrollGestureAxisState(state, scrollDirection, {
					layoutSize,
				});
			});
		}
	});

	return {
		scrollHandler,
		onContentSizeChange,
		onLayout,
		nativeGesture,
	};
};
