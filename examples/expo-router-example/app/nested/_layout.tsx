import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function Layout() {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="one" options={{ enableTransitions: true }} />
			<Stack.Screen
				name="two"
				options={{
					enableTransitions: true,
					screenStyleInterpolator: ({
						current,
						next,
						layouts: {
							screen: { width },
						},
					}) => {
						"worklet";

						const progress = current.progress + (next?.progress ?? 0);

						const x = interpolate(progress, [0, 1, 2], [width, 0, -width]);
						return {
							contentStyle: {
								transform: [{ translateX: x }],
							},
						};
					},
					transitionSpec: {
						close: Transition.specs.DefaultSpec,
						open: Transition.specs.DefaultSpec,
					},
				}}
			/>
			<Stack.Screen
				name="second-nested"
				options={{
					...Transition.presets.SlideFromTop(),
				}}
			/>
		</Stack>
	);
}
