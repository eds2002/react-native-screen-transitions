import { router, useLocalSearchParams } from "expo-router";
import { Text, useWindowDimensions } from "react-native";
import Transition, { Bounds } from "react-native-screen-transitions";

export default function BoundsDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();

	const { width } = useWindowDimensions();

	return (
		<Transition.View
			style={{
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Bounds
				sharedBoundTag={id}
				onPress={router.back}
				testID="test"
				style={{
					width: width * 0.7,
					height: width * 0.7,
					backgroundColor: "#a3e635",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Text style={{ color: "black", fontWeight: "600", fontSize: 20 }}>
					/examples/[{id}]
				</Text>
			</Bounds>
		</Transition.View>
	);
}
