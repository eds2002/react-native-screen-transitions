import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Transition from "react-native-screen-transitions";

interface BoundsIndicatorProps {
	children: ReactNode;
	tag?: string;
}

/**
 * BoundsIndicator - Debug visualization for active viewing area
 *
 * This is NOT a MaskedView. It's a simple container with a green border
 * overlay that shows where the "active viewing area" is. The bounds API
 * animates this indicator's position and size during transitions.
 */
export function BoundsIndicator({
	children,
	tag = "BOUNDS_INDICATOR",
}: BoundsIndicatorProps) {
	return (
		<View style={styles.container}>
			{children}

			{/* Position absolute indicator controlled by bounds API */}
			<View style={StyleSheet.absoluteFillObject}>
				<Transition.View
					sharedBoundTag={"BOUNDS_INDICATOR"}
					style={styles.indicator}
					pointerEvents="none"
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	indicator: {
		borderWidth: 10,
		borderColor: "green",
		borderRadius: 24,
	},
});
