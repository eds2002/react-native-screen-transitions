import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function NestedLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" />
			<Stack.Screen
				name="b"
				options={{ ...Transition.presets.SlideFromTop() }}
			/>
		</Stack>
	);
}
