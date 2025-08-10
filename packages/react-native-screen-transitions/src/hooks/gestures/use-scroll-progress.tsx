import { useCallback } from "react";
import type { LayoutChangeEvent } from "react-native";
import { useAnimatedScrollHandler } from "react-native-reanimated";
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes";
import { useGestureContext } from "../../context/gestures";

interface ScrollProgressHookProps {
	onScroll?: (event: ReanimatedScrollEvent) => void;
	onContentSizeChange?: (width: number, height: number) => void;
	onLayout?: (event: LayoutChangeEvent) => void;
}

export const useScrollProgress = (props: ScrollProgressHookProps) => {
	const { scrollProgress } = useGestureContext();
	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			props.onScroll?.(event);
			scrollProgress.modify((v) => {
				"worklet";
				v.x = event.contentOffset.x;
				v.y = event.contentOffset.y;
				return v;
			});
		},
	});

	const onContentSizeChange = useCallback(
		(width: number, height: number) => {
			props.onContentSizeChange?.(width, height);

			scrollProgress.modify((v) => {
				"worklet";
				v.contentWidth = width;
				v.contentHeight = height;
				return v;
			});
		},
		[scrollProgress, props.onContentSizeChange],
	);

	const onLayout = useCallback(
		(event: LayoutChangeEvent) => {
			props.onLayout?.(event);
			const { width, height } = event.nativeEvent.layout;
			scrollProgress.modify((v) => {
				"worklet";
				v.layoutHeight = height;
				v.layoutWidth = width;
				return v;
			});
		},
		[scrollProgress, props.onLayout],
	);

	return {
		scrollHandler,
		onContentSizeChange,
		onLayout,
	};
};
