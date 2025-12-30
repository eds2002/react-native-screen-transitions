import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function StackProgressLayout() {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="index" />
			<Stack.Screen
				name="pushed"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: "vertical",
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</Stack>
	);
}
