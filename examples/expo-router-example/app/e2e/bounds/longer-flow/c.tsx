import { router } from "expo-router";
import { Pressable } from "react-native";
import Transition from "react-native-screen-transitions";

export default function A() {
	return (
		<Pressable
			style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}
			testID="c"
			onPress={router.back}
		>
			<Transition.Pressable
				sharedBoundTag="bound"
				testID="c-bound"
				style={{ width: 100, height: 100, backgroundColor: "green" }}
			/>
		</Pressable>
	);
}
