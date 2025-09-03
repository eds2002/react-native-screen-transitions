import { Text, View } from "react-native";

export default function AllEdges() {
	return (
		<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
			<Text testID="e2e-gesture-edges-all-edges" pointerEvents="none">
				{" "}
				Gesture should only activate from the edges, not the center.{" "}
			</Text>
		</View>
	);
}
