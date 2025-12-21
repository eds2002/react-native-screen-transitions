import type { ReactNode } from "react";
import type { View } from "react-native";
import {
	type AnimatedRef,
	type MeasuredDimensions,
	measure,
} from "react-native-reanimated";
import createProvider from "../utils/create-provider";

interface LayoutAnchorProviderProps {
	anchorRef: AnimatedRef<View>;
	children: ReactNode;
}

interface LayoutAnchorContextValue {
	/**
	 * Corrects measured dimensions for parent transforms.
	 * The anchor should be at (0, 0) - any offset is from parent transforms.
	 * Subtracting this offset gives the true layout position.
	 */
	correctMeasurement: (measured: MeasuredDimensions) => MeasuredDimensions;
}

/**
 * Provides a reference point for correcting bounds measurements.
 *
 * When a parent view has transforms applied (e.g., during screen transitions),
 * `measure()` returns visual positions that include those transforms. This provider
 * establishes an anchor point (typically the screen container at 0,0) and exposes
 * a `correctMeasurement` function that subtracts the anchor's offset to yield
 * the true layout position.
 */
const { LayoutAnchorProvider, useLayoutAnchorContext } = createProvider(
	"LayoutAnchor",
	{ guarded: false },
)<LayoutAnchorProviderProps, LayoutAnchorContextValue>(
	({ anchorRef, children }) => {
		const correctMeasurement = (
			measured: MeasuredDimensions,
		): MeasuredDimensions => {
			"worklet";
			const anchorMeasured = measure(anchorRef);
			if (!anchorMeasured) return measured;

			return {
				...measured,
				pageX: measured.pageX - anchorMeasured.pageX,
				pageY: measured.pageY - anchorMeasured.pageY,
			};
		};

		return {
			value: { correctMeasurement },
			children,
		};
	},
);

export { LayoutAnchorProvider, useLayoutAnchorContext };
