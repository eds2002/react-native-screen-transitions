import { memo } from "react";
import { StyleSheet, View } from "react-native";

interface MaybeFloatingContainerProps {
	children: React.ReactNode;
	isFloatingOverlay?: boolean;
}
export const MaybeFloatingContainer = memo(function MaybeFloatingContainer({
	children,
	isFloatingOverlay,
}: MaybeFloatingContainerProps) {
	if (!isFloatingOverlay) {
		return children;
	}
	return (
		<View style={styles.float} pointerEvents="box-none">
			{children}
		</View>
	);
});

const styles = StyleSheet.create({
	float: {
		...StyleSheet.absoluteFill,
		zIndex: 999,
	},
});
