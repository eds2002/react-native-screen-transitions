import { memo } from "react";
import { StyleSheet, View } from "react-native";

interface FloatingOverlayLayerProps {
	children: React.ReactNode;
	enabled?: boolean;
}
export const FloatingOverlayLayer = memo(function FloatingOverlayLayer({
	children,
	enabled,
}: FloatingOverlayLayerProps) {
	if (!enabled) {
		return children;
	}
	return (
		<View
			style={[StyleSheet.absoluteFill, styles.float]}
			pointerEvents="box-none"
		>
			{children}
		</View>
	);
});

const styles = StyleSheet.create({
	float: {
		zIndex: 999,
	},
});
