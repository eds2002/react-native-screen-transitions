import { router, useLocalSearchParams } from "expo-router";
import { Text, useWindowDimensions, View } from "react-native";
import Transition from "react-native-screen-transitions";

export default function BoundsDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();

	const { width } = useWindowDimensions();

	return (
		<View
			style={{
				alignItems: "center",
				justifyContent: "center",
				flex: 1,
			}}
		>
			<Transition.Pressable
				onPress={router.back}
				style={{
					width: width * 0.7,
					height: width * 0.7,
					backgroundColor: "#a3e635",
					alignItems: "center",
					justifyContent: "center",
					flex: 0,
				}}
				sharedBoundTag={id}
			>
				<Text style={{ color: "black", fontWeight: "600", fontSize: 20 }}>
					/examples/[{id}]
				</Text>
			</Transition.Pressable>
		</View>
	);
}
