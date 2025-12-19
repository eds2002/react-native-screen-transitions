import { Stack } from "expo-router";

export default function ComponentStackLayout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
				animation: "slide_from_right",
			}}
		>
			<Stack.Screen name="index" />
			<Stack.Screen name="basic" />
			<Stack.Screen name="floating-bar" options={{ headerShown: false }} />
		</Stack>
	);
}
