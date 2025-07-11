import { Stack } from "expo-router";
import Transition from "react-native-screen-transitions";

export default function AGroupLayout() {
	return (
		// Since this group uses a layout, we'll have to wrap the stack in a Transition.View for our transition to work.
		<Transition.View style={{ borderRadius: 36, overflow: "hidden" }}>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="a" />
				<Stack.Screen name="b" />
			</Stack>
		</Transition.View>
	);
}
