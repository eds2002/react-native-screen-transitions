import { useCallback } from "react";
import type {
	LayoutChangeEvent,
	NativeScrollEvent,
	NativeSyntheticEvent,
} from "react-native";
import { useAnimatedScrollHandler } from "react-native-reanimated";
import { useGestureContext } from "../../context/gestures";

interface ScrollProgressHookProps {
	onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
	onContentSizeChange?: (width: number, height: number) => void;
}

export const useScrollProgress = (props: ScrollProgressHookProps) => {
	const { scrollProgress } = useGestureContext();
	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
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
			const { width, height } = event.nativeEvent.layout;
			scrollProgress.modify((v) => {
				"worklet";
				v.layoutHeight = height;
				v.layoutWidth = width;
				return v;
			});
		},
		[scrollProgress],
	);

	return {
		scrollHandler,
		onContentSizeChange,
		onLayout,
	};
};
