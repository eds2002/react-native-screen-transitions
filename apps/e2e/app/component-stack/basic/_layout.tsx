import { Stack } from "expo-router";

export default function BasicLayout() {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="index" />
		</Stack>
	);
}
