/**
 * Connects ScrollViews to the gesture ownership system.
 *
 * Per the spec, ownership is per-direction (not per-axis):
 * - `vertical` and `vertical-inverted` are independent
 * - `horizontal` and `horizontal-inverted` are independent
 *
 * This means a ScrollView on a vertical axis may need to coordinate with
 * multiple gesture owners: one for `vertical` and another for `vertical-inverted`.
 *
 * Example: Settings screen claims `vertical-inverted`, parent workout layout claims `vertical`.
 * The ScrollView should yield to settings for swipe-up at bottom, and to workout for swipe-down at top.
 */

import { useMemo } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Gesture, type GestureType } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useAnimatedScrollHandler } from "react-native-reanimated";
import {
	type GestureContextType,
	type ScrollConfig,
	useGestureContext,
} from "../../providers/gestures.provider";
import type { Direction } from "../../types/ownership.types";
import useStableCallback from "../use-stable-callback";

/** Walks up context tree to find the screen that owns a specific direction. */
function findGestureOwnerForDirection(
	context: GestureContextType | null | undefined,
	direction: Direction,
): GestureContextType | null {
	let current = context;
	const startIsolated = context?.isIsolated;

	while (current) {
		if (startIsolated !== undefined && current.isIsolated !== startIsolated) {
			break;
		}

		if (current.claimedDirections?.[direction]) {
			return current;
		}

		current = current.ancestorContext;
	}

	return null;
}

/**
 * Finds all gesture owners for a scroll axis (both directions).
 * Returns deduplicated list of owners - a snap-point sheet claiming both
 * directions will only appear once.
 */
function findGestureOwnersForAxis(
	context: GestureContextType | null | undefined,
	axis: "vertical" | "horizontal",
): GestureContextType[] {
	const directions: [Direction, Direction] =
		axis === "vertical"
			? ["vertical", "vertical-inverted"]
			: ["horizontal", "horizontal-inverted"];

	const owners: GestureContextType[] = [];

	for (const dir of directions) {
		const owner = findGestureOwnerForDirection(context, dir);
		if (owner && !owners.includes(owner)) {
			owners.push(owner);
		}
	}

	return owners;
}

interface ScrollProgressHookProps {
	onContentSizeChange?: (width: number, height: number) => void;
	onLayout?: (event: LayoutChangeEvent) => void;
	direction?: "vertical" | "horizontal";
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
export const useScrollRegistry = (props: ScrollProgressHookProps) => {
	const context = useGestureContext();
	const scrollDirection = props.direction ?? "vertical";

	// Find all owners for both directions on this axis
	const owners = useMemo(
		() => findGestureOwnersForAxis(context, scrollDirection),
		[context, scrollDirection],
	);

	// Extract scrollConfigs and panGestures from owners
	const scrollConfigs = useMemo(
		() =>
			owners
				.map((o) => o.scrollConfig)
				.filter((c): c is SharedValue<ScrollConfig | null> => c !== null),
		[owners],
	);

	const panGestures = useMemo(
		() =>
			owners
				.map((o) => o.panGesture)
				.filter((g): g is GestureType => g !== null),
		[owners],
	);

	const nativeGesture = useMemo(() => {
		if (panGestures.length === 0 || scrollConfigs.length === 0) return null;

		// Update isTouched on ALL registered scrollConfigs
		const setIsTouched = () => {
			"worklet";
			for (const scrollConfig of scrollConfigs) {
				if (scrollConfig.value) {
					scrollConfig.value = { ...scrollConfig.value, isTouched: true };
				}
			}
		};

		const clearIsTouched = () => {
			"worklet";
			for (const scrollConfig of scrollConfigs) {
				if (scrollConfig.value) {
					scrollConfig.value = { ...scrollConfig.value, isTouched: false };
				}
			}
		};

		// Native gesture must require ALL pan gestures to fail
		// This allows any direction owner to take control at the appropriate boundary
		let gesture = Gesture.Native()
			.onTouchesDown(setIsTouched)
			.onTouchesUp(clearIsTouched)
			.onTouchesCancelled(clearIsTouched);

		for (const panGesture of panGestures) {
			gesture = gesture.requireExternalGestureToFail(panGesture);
		}

		return gesture;
	}, [panGestures, scrollConfigs]);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			if (scrollConfigs.length === 0) return;

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

			// Update ALL registered scrollConfigs
			for (const scrollConfig of scrollConfigs) {
				scrollConfig.modify(update);
			}
		},
	});

	const onContentSizeChange = useStableCallback(
		(width: number, height: number) => {
			props.onContentSizeChange?.(width, height);
			if (scrollConfigs.length === 0) return;

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

			// Update ALL registered scrollConfigs
			for (const scrollConfig of scrollConfigs) {
				scrollConfig.modify(update);
			}
		},
	);

	const onLayout = useStableCallback((event: LayoutChangeEvent) => {
		props.onLayout?.(event);
		if (scrollConfigs.length === 0) return;

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

		// Update ALL registered scrollConfigs
		for (const scrollConfig of scrollConfigs) {
			scrollConfig.modify(update);
		}
	});

	return {
		scrollHandler,
		onContentSizeChange,
		onLayout,
		nativeGesture,
	};
};
