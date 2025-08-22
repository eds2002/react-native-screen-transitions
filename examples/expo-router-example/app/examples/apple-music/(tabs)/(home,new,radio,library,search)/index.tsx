import { router } from "expo-router";
import { View } from "react-native";
import Transition from "react-native-screen-transitions";

export default function IndexScreen() {
	return (
		<View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
			<Transition.Pressable
				sharedBoundTag="test"
				onPress={() => router.push("/examples/apple-music/123")}
				style={{
					width: 200,
					height: 300,
					backgroundColor: "red",
					justifyContent: "center",
					alignItems: "center",
				}}
			/>
		</View>
	);
}
