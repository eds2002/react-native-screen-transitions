import { useCallback } from "react";
import { useAnimatedScrollHandler } from "react-native-reanimated";
import { useGestureContext } from "@/contexts/gesture";

interface ScrollProgressHookProps {
	onContentSizeChange?: (width: number, height: number) => void;
}

export const useScrollProgress = (props: ScrollProgressHookProps) => {
	const { scrollProgress } = useGestureContext();

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollProgress.modify((value) => {
				"worklet";
				return {
					...value,
					x: event.contentOffset.x,
					y: event.contentOffset.y,
					layoutHeight: event.layoutMeasurement.height,
					layoutWidth: event.layoutMeasurement.width,
					contentHeight: event.contentSize.height,
					contentWidth: event.contentSize.width,
				};
			});
		},
	});

	const onContentSizeChange = useCallback(
		(width: number, height: number) => {
			props.onContentSizeChange?.(width, height);

			scrollProgress.modify((value) => {
				"worklet";
				return {
					...value,
					contentWidth: width,
					contentHeight: height,
				};
			});
		},
		[scrollProgress, props.onContentSizeChange],
	);

	return {
		scrollHandler,
		onContentSizeChange,
	};
};
