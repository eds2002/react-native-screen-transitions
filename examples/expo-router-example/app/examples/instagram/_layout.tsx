import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function StyleIdLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{ title: "Bounds + Style Id", headerShown: false }}
			/>
			<Stack.Screen
				name="[id]"
				options={{
					...Transition.presets.SharedMaskedView(),
				}}
			/>
		</Stack>
	);
}
