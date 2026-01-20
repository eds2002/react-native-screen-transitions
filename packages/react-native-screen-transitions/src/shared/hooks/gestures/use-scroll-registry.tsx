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
 *
 * ## Axis-Based Gesture Owner Resolution
 *
 * ScrollViews report their state to the gesture OWNER for their scroll axis,
 * not necessarily the current screen. This enables axis isolation:
 *
 * ```
 * workout (claims vertical)
 *   └─ exercise (claims horizontal)
 *        └─ <VerticalScrollView> → reports to workout (owns vertical)
 *        └─ <HorizontalScrollView> → reports to exercise (owns horizontal)
 * ```
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

/**
 * Finds the gesture owner for a specific scroll axis by walking up the context tree.
 * Returns the scrollConfig and panGesture from the screen that claims this axis.
 *
 * @param context - Current gesture context
 * @param axis - The scroll axis ('vertical' or 'horizontal')
 * @returns The owner's scrollConfig and panGesture, or nulls if no owner found
 */
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
		// Stop at isolation boundary (don't cross between isolated and non-isolated stacks)
		if (startIsolated !== undefined && current.isIsolated !== startIsolated) {
			break;
		}

		// Check if this screen owns this axis (claims the direction or its inverse)
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

	// No owner found for this axis
	return { scrollConfig: null, panGesture: null };
}

interface ScrollProgressHookProps {
	onScroll?: (event: ReanimatedScrollEvent) => void;
	onContentSizeChange?: (width: number, height: number) => void;
	onLayout?: (event: LayoutChangeEvent) => void;
	/**
	 * The scroll direction of the ScrollView.
	 * Used to find the correct gesture owner for this axis.
	 * Defaults to 'vertical'.
	 */
	direction?: "vertical" | "horizontal";
}

/**
 * Returns event handlers to attach to a ScrollView for gesture coordination.
 * All handlers pass through to user-provided handlers if specified.
 *
 * The hook finds the gesture owner for the ScrollView's axis and returns:
 * - Event handlers that report scroll state to the owner's scrollConfig
 * - A native gesture that coordinates with the owner's panGesture
 */
export const useScrollRegistry = (props: ScrollProgressHookProps) => {
	const context = useGestureContext();
	const scrollDirection = props.direction ?? "vertical";

	// Find the gesture owner for this scroll axis
	const { scrollConfig, panGesture } = findGestureOwnerForAxis(
		context,
		scrollDirection,
	);

	// Create a native gesture that coordinates with the owner's pan gesture
	// We must create a NEW gesture instance (can't reuse owner's nativeGesture)
	const nativeGesture = useMemo(() => {
		if (!panGesture || !scrollConfig) {
			return null;
		}

		// Track touch state on the owner's scrollConfig
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

		// Create native gesture that:
		// 1. Tracks isTouched on the owner's scrollConfig
		// 2. Waits for the owner's panGesture to fail before allowing native scroll
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
		/** A native gesture coordinated with the gesture owner's panGesture, or null if no owner */
		nativeGesture,
	};
};
