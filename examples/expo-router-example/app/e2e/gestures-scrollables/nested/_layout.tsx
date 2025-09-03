import { Stack } from "@/layouts/stack";
export default function NestedLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{ headerShown: false, gestureDirection: "horizontal" }}
			/>
		</Stack>
	);
}
