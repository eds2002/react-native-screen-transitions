import { Text, View } from "react-native";
import Transition from "react-native-screen-transitions";

export default function HorizontalScrollableGestures() {
	return (
		<Transition.ScrollView
			horizontal
			style={{ flex: 1 }}
			contentContainerStyle={{
				flexDirection: "row",
				alignItems: "center",
				paddingHorizontal: 20,
				gap: 16,
			}}
		>
			{Array.from({ length: 20 }, (_, i) => (
				<View
					key={i.toString()}
					style={{
						width: 120,
						height: 80,
						backgroundColor: i % 2 === 0 ? "#f8f8f8" : "#e8e8e8",
						borderRadius: 8,
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Text style={{ fontSize: 16, fontWeight: "600", color: "#666" }}>
						Item {i + 1}
					</Text>
					<Text style={{ fontSize: 12, color: "#999", marginTop: 4 }}>
						Scroll to test gesture triggers
					</Text>
				</View>
			))}
		</Transition.ScrollView>
	);
}
