import { router } from "expo-router";

import { Pressable } from "react-native";
import Transition from "react-native-screen-transitions";

export default function A() {
	return (
		<Pressable
			style={{ flex: 1, alignItems: "center", justifyContent: "flex-start" }}
			testID="a"
			onPress={router.back}
		>
			<Transition.Pressable
				sharedBoundTag="bound"
				testID="a-bound"
				style={{ width: 200, height: 200, backgroundColor: "blue" }}
				onPress={() => {
					router.push("/e2e/bounds/longer-flow/b");
				}}
			/>
		</Pressable>
	);
}
