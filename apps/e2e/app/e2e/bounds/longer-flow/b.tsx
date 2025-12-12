import { router } from "expo-router";
import { Pressable } from "react-native";
import Transition from "react-native-screen-transitions";

export default function A() {
	return (
		<Pressable
			style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
			testID="b"
			onPress={router.back}
		>
			<Transition.Pressable
				sharedBoundTag="bound"
				testID="b-bound"
				style={{ width: 150, height: 150, backgroundColor: "red" }}
				onPress={() => {
					router.push("/e2e/bounds/longer-flow/c");
				}}
			/>
		</Pressable>
	);
}
