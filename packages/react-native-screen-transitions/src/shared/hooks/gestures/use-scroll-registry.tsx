/**
 * ScrollView State Registry for Gesture Handoff
 *
 * ## Mental Model
 *
 * This hook connects a ScrollView to the gesture ownership system by tracking:
 * - **Scroll position** (x, y): For boundary detection
 * - **Content size**: To calculate max scroll positions
 * - **Layout size**: To determine if content is scrollable
 *
 * ## How It Works With Gestures
 *
 * The gesture handler (use-screen-gesture-handlers) checks `isTouched` to determine
 * if a touch is on ScrollView vs deadspace:
 *
 * ```
 * Touch on deadspace → Gesture controls sheet directly
 * Touch on ScrollView → Check boundary before yielding to gesture
 * ```
 *
 * Note: The `isTouched` flag is managed by the nativeGesture handlers in
 * use-build-gestures.tsx, which run on the UI thread to avoid race conditions.
 *
 * ## Boundary Rules (per spec)
 *
 * | Sheet Type | Boundary | Yields When |
 * |------------|----------|-------------|
 * | Bottom (vertical) | scrollY = 0 | Can't scroll further up |
 * | Top (vertical-inverted) | scrollY >= maxY | Can't scroll further down |
 */

import type { LayoutChangeEvent } from "react-native";
import { useAnimatedScrollHandler } from "react-native-reanimated";
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes";
import { useGestureContext } from "../../providers/gestures.provider";
import useStableCallback from "../use-stable-callback";

interface ScrollProgressHookProps {
	onScroll?: (event: ReanimatedScrollEvent) => void;
	onContentSizeChange?: (width: number, height: number) => void;
	onLayout?: (event: LayoutChangeEvent) => void;
}

/**
 * Returns event handlers to attach to a ScrollView for gesture coordination.
 * All handlers pass through to user-provided handlers if specified.
 */
export const useScrollRegistry = (props: ScrollProgressHookProps) => {
	const context = useGestureContext();
	const scrollConfig = context?.scrollConfig;

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			props.onScroll?.(event);

			if (!scrollConfig) return;

			const updateScrollPosition = (v: any) => {
				"worklet";
				if (v === null) {
					return {
						x: event.contentOffset.x,
						y: event.contentOffset.y,
						contentHeight: 0,
						contentWidth: 0,
						layoutHeight: 0,
						layoutWidth: 0,
						isTouched: true,
					};
				}
				v.x = event.contentOffset.x;
				v.y = event.contentOffset.y;
				return v;
			};

			scrollConfig.modify(updateScrollPosition);
		},
	});

	const onContentSizeChange = useStableCallback(
		(width: number, height: number) => {
			props.onContentSizeChange?.(width, height);

			if (!scrollConfig) return;

			const updateContentSize = (v: any) => {
				"worklet";
				if (v === null) {
					return {
						x: 0,
						y: 0,
						layoutHeight: 0,
						layoutWidth: 0,
						contentWidth: width,
						contentHeight: height,
						isTouched: false,
					};
				}
				v.contentWidth = width;
				v.contentHeight = height;
				return v;
			};

			scrollConfig.modify(updateContentSize);
		},
	);

	const onLayout = useStableCallback((event: LayoutChangeEvent) => {
		props.onLayout?.(event);

		if (!scrollConfig) return;

		const { width, height } = event.nativeEvent.layout;

		const updateLayout = (v: any) => {
			"worklet";
			if (v === null) {
				return {
					x: 0,
					y: 0,
					contentHeight: 0,
					contentWidth: 0,
					layoutHeight: height,
					layoutWidth: width,
					isTouched: false,
				};
			}
			v.layoutHeight = height;
			v.layoutWidth = width;
			return v;
		};

		scrollConfig.modify(updateLayout);
	});

	return {
		scrollHandler,
		onContentSizeChange,
		onLayout,
	};
};
