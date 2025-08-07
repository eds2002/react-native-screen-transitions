import { Stack } from "@/layouts/stack";

export default function Layout() {
	return (
		<Stack>
			<Stack.Screen
				name="a"
				options={{
					headerShown: false,
				}}
			/>
		</Stack>
	);
}
