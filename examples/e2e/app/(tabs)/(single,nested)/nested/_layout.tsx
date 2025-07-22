import { Stack } from "@/layout/stack";
import Transition from "react-native-screen-transitions";

export default function Layout() {
	return (
		<Stack
			screenOptions={{
				headerShown: false,
			}}
		>
			<Stack.Screen
				name="index"
				options={{
					skipDefaultScreenOptions: true,
					contentStyle: {
						backgroundColor: "white",
					},
				}}
			/>
			<Stack.Screen
				name="a"
				options={{
					...Transition.presets.SlideFromTop(),
				}}
			/>
		</Stack>
	);
}
