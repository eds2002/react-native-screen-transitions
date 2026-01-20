/**
 * Connects ScrollViews to the gesture ownership system.
 * Finds the gesture owner for the scroll axis and coordinates with their panGesture.
 */

import { useMemo } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Gesture, type GestureType } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useAnimatedScrollHandler } from "react-native-reanimated";
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes";
import {
	type GestureContextType,
	type ScrollConfig,
	useGestureContext,
} from "../../providers/gestures.provider";
import useStableCallback from "../use-stable-callback";

/** Walks up context tree to find the screen that owns this scroll axis. */
function findGestureOwnerForAxis(
	context: GestureContextType | null | undefined,
	axis: "vertical" | "horizontal",
): {
	scrollConfig: SharedValue<ScrollConfig | null> | null;
	panGesture: GestureType | null;
} {
	let current = context;
	const startIsolated = context?.isIsolated;

	while (current) {
		if (startIsolated !== undefined && current.isIsolated !== startIsolated) {
			break;
		}

		const ownsAxis =
			axis === "vertical"
				? current.claimedDirections?.vertical ||
					current.claimedDirections?.["vertical-inverted"]
				: current.claimedDirections?.horizontal ||
					current.claimedDirections?.["horizontal-inverted"];

		if (ownsAxis) {
			return {
				scrollConfig: current.scrollConfig,
				panGesture: current.panGesture,
			};
		}

		current = current.ancestorContext;
	}

	return { scrollConfig: null, panGesture: null };
}

interface ScrollProgressHookProps {
	onScroll?: (event: ReanimatedScrollEvent) => void;
	onContentSizeChange?: (width: number, height: number) => void;
	onLayout?: (event: LayoutChangeEvent) => void;
	direction?: "vertical" | "horizontal";
}

/**
 * Returns scroll handlers and a native gesture for ScrollView coordination.
 * Automatically finds the gesture owner for the scroll axis.
 */
export const useScrollRegistry = (props: ScrollProgressHookProps) => {
	const context = useGestureContext();
	const scrollDirection = props.direction ?? "vertical";

	const { scrollConfig, panGesture } = findGestureOwnerForAxis(
		context,
		scrollDirection,
	);

	const nativeGesture = useMemo(() => {
		if (!panGesture || !scrollConfig) return null;

		const setIsTouched = () => {
			"worklet";
			if (scrollConfig.value) {
				scrollConfig.value = { ...scrollConfig.value, isTouched: true };
			}
		};

		const clearIsTouched = () => {
			"worklet";
			if (scrollConfig.value) {
				scrollConfig.value = { ...scrollConfig.value, isTouched: false };
			}
		};

		return Gesture.Native()
			.onTouchesDown(setIsTouched)
			.onTouchesUp(clearIsTouched)
			.onTouchesCancelled(clearIsTouched)
			.requireExternalGestureToFail(panGesture);
	}, [panGesture, scrollConfig]);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			props.onScroll?.(event);
			if (!scrollConfig) return;

			const update = (v: any) => {
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
			scrollConfig.modify(update);
		},
	});

	const onContentSizeChange = useStableCallback(
		(width: number, height: number) => {
			props.onContentSizeChange?.(width, height);
			if (!scrollConfig) return;

			const update = (v: any) => {
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
			scrollConfig.modify(update);
		},
	);

	const onLayout = useStableCallback((event: LayoutChangeEvent) => {
		props.onLayout?.(event);
		if (!scrollConfig) return;

		const { width, height } = event.nativeEvent.layout;

		const update = (v: any) => {
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
		scrollConfig.modify(update);
	});

	return {
		scrollHandler,
		onContentSizeChange,
		onLayout,
		nativeGesture,
	};
};
