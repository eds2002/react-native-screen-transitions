import { useLocalSearchParams } from "expo-router";
import { Text, useWindowDimensions, View } from "react-native";
import Transition from "react-native-screen-transitions";

export default function ActiveBoundsScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { width } = useWindowDimensions();
	return (
		<View
			style={{
				flex: 1,
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Transition.View
				sharedBoundTag={id}
				style={{
					backgroundColor: "lightblue",
					width: width * 0.9,
					height: width * 0.9,
					alignItems: "center",
					justifyContent: "center",
					padding: 12,
				}}
			>
				<Text style={{ fontSize: 16, fontWeight: "500", textAlign: "center" }}>
					{`sharedBoundTag - \n "active-bounds-${id}"`}
				</Text>
			</Transition.View>
		</View>
	);
}
