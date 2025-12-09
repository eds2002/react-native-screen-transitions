/** biome-ignore-all lint/style/noNonNullAssertion: <Will always consume context from GestureProvider> */

import { useMemo } from "react";
import type { LayoutChangeEvent } from "react-native";
import { useAnimatedScrollHandler } from "react-native-reanimated";
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes";
import { useGestureContext } from "../../providers/gestures.provider";
import type { Any } from "../../types/utils.types";
import useStableCallback from "../use-stable-callback";

interface ScrollProgressHookProps {
	onScroll?: (event: ReanimatedScrollEvent) => void;
	onContentSizeChange?: (width: number, height: number) => void;
	onLayout?: (event: LayoutChangeEvent) => void;
}

export const useScrollRegistry = (props: ScrollProgressHookProps) => {
	const context = useGestureContext()!;
	const { scrollConfig, ancestorContext } = context;

	const ancestorScrollConfigs = useMemo(() => {
		const configs: (typeof scrollConfig)[] = [];
		let current = ancestorContext;
		while (current) {
			if (current.scrollConfig) {
				configs.push(current.scrollConfig);
			}
			current = current.ancestorContext;
		}
		return configs;
	}, [ancestorContext]);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			props.onScroll?.(event);

			const updateScrollPosition = (v: Any) => {
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
			};

			scrollConfig.modify(updateScrollPosition);

			// Sync to ALL ancestors, not just immediate parent
			for (const ancestorConfig of ancestorScrollConfigs) {
				ancestorConfig.modify(updateScrollPosition);
			}
		},
	});

	const onContentSizeChange = useStableCallback(
		(width: number, height: number) => {
			props.onContentSizeChange?.(width, height);

			const updateContentSize = (v: Any) => {
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
			};

			scrollConfig.modify(updateContentSize);

			for (const ancestorConfig of ancestorScrollConfigs) {
				ancestorConfig.modify(updateContentSize);
			}
		},
	);

	const onLayout = useStableCallback((event: LayoutChangeEvent) => {
		props.onLayout?.(event);
		const { width, height } = event.nativeEvent.layout;

		const updateLayout = (v: Any) => {
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
		};

		scrollConfig.modify(updateLayout);

		for (const ancestorConfig of ancestorScrollConfigs) {
			ancestorConfig.modify(updateLayout);
		}
	});

	return {
		scrollHandler,
		onContentSizeChange,
		onLayout,
	};
};
