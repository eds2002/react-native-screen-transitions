import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function NestedLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="a"
				options={{ headerShown: false, enableTransitions: true }}
			/>
			<Stack.Screen
				name="b"
				options={{
					headerShown: false,
					enableTransitions: true,
					gestureDirection: "horizontal",
					gestureEnabled: true,
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { width },
						},
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
						open: Transition.specs.DefaultSpec,
						close: Transition.specs.DefaultSpec,
					},
				}}
			/>
			<Stack.Screen
				name="nested-two"
				options={{
					headerShown: false,
					enableTransitions: true,
					...Transition.presets.SlideFromTop(),
				}}
			/>
		</Stack>
	);
}
