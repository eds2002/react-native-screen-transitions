import { Stack } from "@/layouts/stack";

export default function BoundsExampleLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="a"
				options={{
					title: "A",
					skipDefaultScreenOptions: true,
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="b"
				options={{
					title: "B",
					screenStyleInterpolator: (props) => {
						return {
							contentStyle: {},
						};
					},
				}}
			/>
		</Stack>
	);
}
