import { Text, View } from "react-native";

export default function CustomEdges() {
	return (
		<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
			<Text testID="e2e-gesture-edges-custom-edges" pointerEvents="none">
				Gesture should only activate from the left edge, while can swipe
				anywhere vertically.
			</Text>
		</View>
	);
}
