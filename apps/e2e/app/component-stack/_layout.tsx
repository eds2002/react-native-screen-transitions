import { Stack } from "expo-router";

export default function ComponentStackLayout() {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="index" />
		</Stack>
	);
}
