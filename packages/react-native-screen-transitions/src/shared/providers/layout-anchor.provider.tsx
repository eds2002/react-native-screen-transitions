import { type ReactNode, useCallback, useMemo } from "react";
import type { View } from "react-native";
import {
	type AnimatedRef,
	type MeasuredDimensions,
	measure,
} from "react-native-reanimated";
import createProvider from "../utils/create-provider";
import { useViewportContext } from "./viewport.provider";

interface LayoutAnchorProviderProps {
	anchorRef: AnimatedRef<View>;
	children: ReactNode;
}

interface LayoutAnchorContextValue {
	/**
	 * Corrects measured dimensions for parent transforms (translation and scale).
	 * The anchor should be at (0, 0) with full screen dimensions - any difference
	 * is from parent transforms. This function reverses those transforms to yield
	 * the true layout position and dimensions.
	 */
	correctMeasurement: (measured: MeasuredDimensions) => MeasuredDimensions;
	/**
	 * Returns true when the corrected measurement is plausibly inside viewport space.
	 * This helps reject transient off-page measurements from paged containers.
	 */
	isMeasurementInViewport: (measured: MeasuredDimensions) => boolean;
}

/**
 * Provides a reference point for correcting bounds measurements.
 *
 * When a parent view has transforms applied (e.g., during screen transitions),
 * `measure()` returns visual positions that include those transforms. This provider
 * establishes an anchor point (typically the screen container at 0,0) and exposes
 * a `correctMeasurement` function that reverses translation and scale transforms
 * to yield the true layout position and dimensions.
 *
 * ## How it works
 *
 * 1. **Translation**: Subtract anchor's pageX/pageY offset
 * 2. **Scale**: Compare anchor's measured size to expected (screen) size to compute
 *    scale factor, then divide positions and dimensions by that factor
 */
const { LayoutAnchorProvider, useLayoutAnchorContext } = createProvider(
	"LayoutAnchor",
	{ guarded: false },
)<LayoutAnchorProviderProps, LayoutAnchorContextValue>(
	({ anchorRef, children }) => {
		const {
			dimensions: { width: screenWidth, height: screenHeight },
		} = useViewportContext();

		const correctMeasurement = useCallback(
			(measured: MeasuredDimensions): MeasuredDimensions => {
				"worklet";
				const anchor = measure(anchorRef);
				if (!anchor) return measured;

				// Compute scale factor by comparing anchor size to expected screen size.
				// Anchor should be full-screen (absoluteFill), so any difference is from scale.
				const scaleX = anchor.width > 0 ? anchor.width / screenWidth : 1;
				const scaleY = anchor.height > 0 ? anchor.height / screenHeight : 1;

				// Get element position relative to anchor (removes translation)
				const relativeX = measured.pageX - anchor.pageX;
				const relativeY = measured.pageY - anchor.pageY;

				// Reverse scale: divide relative position and dimensions by scale factor
				return {
					x: measured.x,
					y: measured.y,
					width: scaleX !== 1 ? measured.width / scaleX : measured.width,
					height: scaleY !== 1 ? measured.height / scaleY : measured.height,
					pageX: scaleX !== 1 ? relativeX / scaleX : relativeX,
					pageY: scaleY !== 1 ? relativeY / scaleY : relativeY,
				};
			},
			[anchorRef, screenWidth, screenHeight],
		);

		const isMeasurementInViewport = useCallback(
			(measured: MeasuredDimensions): boolean => {
				"worklet";
				if (measured.width <= 0 || measured.height <= 0) return false;

				const toleranceX = screenWidth * 0.15;
				const toleranceY = screenHeight * 0.15;
				const centerX = measured.pageX + measured.width / 2;
				const centerY = measured.pageY + measured.height / 2;

				return (
					centerX >= -toleranceX &&
					centerX <= screenWidth + toleranceX &&
					centerY >= -toleranceY &&
					centerY <= screenHeight + toleranceY
				);
			},
			[screenWidth, screenHeight],
		);

		const value = useMemo(
			() => ({ correctMeasurement, isMeasurementInViewport }),
			[correctMeasurement, isMeasurementInViewport],
		);

		return {
			value,
			children,
		};
	},
);

export { LayoutAnchorProvider, useLayoutAnchorContext };
