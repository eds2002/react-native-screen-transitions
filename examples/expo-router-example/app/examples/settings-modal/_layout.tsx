import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function Layout() {
	return (
		<Stack>
			<Stack.Screen
				name="a"
				options={{ headerShown: false, enableTransitions: true }}
			/>
			<Stack.Screen
				name="b"
				options={{
					enableTransitions: true,
					gestureDirection: "horizontal",
					gestureEnabled: true,
					screenStyleInterpolator: ({
						layouts: {
							screen: { width },
						},
						progress,
					}) => {
						"worklet";
						const x = interpolate(progress, [0, 1, 2], [width, 0, -width]);
						return {
							contentStyle: {
								transform: [{ translateX: x }],
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</Stack>
	);
}
