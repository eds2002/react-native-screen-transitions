/**
 * useScrollRegistry - Tracks scroll state for gesture handoff
 *
 * This hook registers a ScrollView's scroll state with the gesture system.
 * The ownership system handles "who gets the gesture" - this hook just
 * tracks the local scroll state so the gesture handler can check boundaries.
 *
 * Per the spec:
 * - ScrollView must be at boundary before yielding to gestures
 * - Ownership resolution determines which gesture handler activates
 * - Only the owner checks scroll boundaries
 */

import type { GestureResponderEvent, LayoutChangeEvent } from "react-native";
import { useAnimatedScrollHandler } from "react-native-reanimated";
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes";
import { useGestureContext } from "../../providers/gestures.provider";
import useStableCallback from "../use-stable-callback";

interface ScrollProgressHookProps {
	onScroll?: (event: ReanimatedScrollEvent) => void;
	onContentSizeChange?: (width: number, height: number) => void;
	onLayout?: (event: LayoutChangeEvent) => void;
	onTouchStart?: (event: GestureResponderEvent) => void;
	onTouchEnd?: (event: GestureResponderEvent) => void;
}

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

	const onTouchStart = useStableCallback((event: GestureResponderEvent) => {
		props.onTouchStart?.(event);

		if (!scrollConfig) return;

		const setTouched = (v: any) => {
			"worklet";
			if (v === null) {
				return {
					x: 0,
					y: 0,
					contentHeight: 0,
					contentWidth: 0,
					layoutHeight: 0,
					layoutWidth: 0,
					isTouched: true,
				};
			}
			v.isTouched = true;
			return v;
		};

		scrollConfig.modify(setTouched);
	});

	const onTouchEnd = useStableCallback((event: GestureResponderEvent) => {
		props.onTouchEnd?.(event);

		if (!scrollConfig) return;

		const clearTouched = (v: any) => {
			"worklet";
			if (v === null) return v;
			v.isTouched = false;
			return v;
		};

		scrollConfig.modify(clearTouched);
	});

	return {
		scrollHandler,
		onContentSizeChange,
		onLayout,
		onTouchStart,
		onTouchEnd,
	};
};
