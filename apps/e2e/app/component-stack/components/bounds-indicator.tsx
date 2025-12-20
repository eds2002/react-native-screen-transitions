import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Transition from "react-native-screen-transitions";

interface BoundsIndicatorProps {
	children: ReactNode;
}

/**
 * BoundsIndicator - Debug visualization for active viewing area
 *
 * This is NOT a MaskedView. It's a simple container with a green border
 * overlay that shows where the "active viewing area" is. The bounds API
 * animates this indicator's position and size during transitions.
 */
export function BoundsIndicator({ children }: BoundsIndicatorProps) {
	return (
		<View style={styles.container}>
			{children}

			{/* Position absolute indicator controlled by bounds API */}
			<Transition.View
				sharedBoundTag="BOUNDS_INDICATOR"
				style={styles.indicator}
				pointerEvents="none"
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	indicator: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderWidth: 3,
		borderColor: "green",
		borderRadius: 24,
	},
});
