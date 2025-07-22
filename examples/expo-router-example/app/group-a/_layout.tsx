import { Stack } from "expo-router";
import Transition from "react-native-screen-transitions";

export default function AGroupLayout() {
	return (
		<Transition.View style={{ borderRadius: 36, overflow: "hidden" }}>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="a" />
				<Stack.Screen name="b" />
			</Stack>
		</Transition.View>
	);
}
