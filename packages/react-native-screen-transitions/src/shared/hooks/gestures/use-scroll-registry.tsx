import type { LayoutChangeEvent } from "react-native";
import { useAnimatedScrollHandler } from "react-native-reanimated";
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes";
import { useGestureContext } from "../../providers/gestures.provider";
import type { Any } from "../../types/utils";
import useStableCallback from "../use-stable-callback";

interface ScrollProgressHookProps {
	onScroll?: (event: ReanimatedScrollEvent) => void;
	onContentSizeChange?: (width: number, height: number) => void;
	onLayout?: (event: LayoutChangeEvent) => void;
}

export const useScrollRegistry = (props: ScrollProgressHookProps) => {
	const { scrollConfig, parentContext } = useGestureContext();

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			props.onScroll?.(event);

			scrollConfig.modify((v: Any) => {
				"worklet";
				if (v === null) {
					return {
						x: event.contentOffset.x,
						y: event.contentOffset.y,
						contentHeight: 0,
						contentWidth: 0,
						layoutHeight: 0,
						layoutWidth: 0,
					};
				}
				v.x = event.contentOffset.x;
				v.y = event.contentOffset.y;
				return v;
			});

			if (parentContext?.scrollConfig) {
				parentContext.scrollConfig.modify((v: Any) => {
					"worklet";
					if (v === null) {
						return {
							x: event.contentOffset.x,
							y: event.contentOffset.y,
							contentHeight: 0,
							contentWidth: 0,
							layoutHeight: 0,
							layoutWidth: 0,
						};
					}
					v.x = event.contentOffset.x;
					v.y = event.contentOffset.y;
					return v;
				});
			}
		},
	});

	const onContentSizeChange = useStableCallback(
		(width: number, height: number) => {
			props.onContentSizeChange?.(width, height);

			scrollConfig.modify((v: Any) => {
				"worklet";
				if (v === null) {
					return {
						x: 0,
						y: 0,
						layoutHeight: 0,
						layoutWidth: 0,
						contentWidth: width,
						contentHeight: height,
					};
				}
				v.contentWidth = width;
				v.contentHeight = height;
				return v;
			});
			if (parentContext?.scrollConfig) {
				parentContext.scrollConfig.modify((v: Any) => {
					"worklet";
					if (v === null) {
						return {
							x: 0,
							y: 0,
							layoutHeight: 0,
							layoutWidth: 0,
							contentWidth: width,
							contentHeight: height,
						};
					}
					v.contentWidth = width;
					v.contentHeight = height;
					return v;
				});
			}
		},
	);

	const onLayout = useStableCallback((event: LayoutChangeEvent) => {
		props.onLayout?.(event);
		const { width, height } = event.nativeEvent.layout;

		scrollConfig.modify((v: Any) => {
			"worklet";
			if (v === null) {
				return {
					x: 0,
					y: 0,
					contentHeight: 0,
					contentWidth: 0,
					layoutHeight: height,
					layoutWidth: width,
				};
			}
			v.layoutHeight = height;
			v.layoutWidth = width;
			return v;
		});
		if (parentContext?.scrollConfig) {
			parentContext.scrollConfig.modify((v: Any) => {
				"worklet";
				if (v === null) {
					return {
						x: 0,
						y: 0,
						contentHeight: 0,
						contentWidth: 0,
						layoutHeight: height,
						layoutWidth: width,
					};
				}
				v.layoutHeight = height;
				v.layoutWidth = width;
				return v;
			});
		}
	});

	return {
		scrollHandler,
		onContentSizeChange,
		onLayout,
	};
};
