import { Stack } from "@/layout/stack";
import { Easing, interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";

export default function Layout() {
	return (
		<Stack
			// Typically wouldn't use screenOptions here, since it animates on mount, but for the sake of testing, i DONT CARE.
			screenOptions={{
				screenStyleInterpolator: ({
					current,
					next,
					layouts: {
						screen: { width },
					},
				}) => {
					"worklet";
					const progress = current.progress.value + (next?.progress.value || 0);

					const x = interpolate(progress, [0, 1, 2], [width, 0, -width]);

					return {
						contentStyle: {
							transform: [{ translateX: x }],
						},
					};
				},
				transitionSpec: {
					open: {
						duration: 400,
						easing: Easing.bezierFn(0.645, 0.045, 0.355, 1),
					},
					close: {
						duration: 400,
						easing: Easing.bezierFn(0.645, 0.045, 0.355, 1),
					},
				},
			}}
		>
			<Stack.Screen
				name="index"
				options={{
					headerShown: false,
					skipDefaultScreenOptions: true,
					screenStyleInterpolator: undefined,
					contentStyle: {
						backgroundColor: "white",
					},
				}}
			/>

			{/* Gesture-enabled screens */}
			<Stack.Screen
				name="gesture-horizontal"
				options={{
					headerShown: false,
					gestureEnabled: true,
					gestureDirection: "horizontal",
				}}
			/>
			<Stack.Screen
				name="gesture-vertical"
				options={{
					headerShown: false,
					gestureEnabled: true,
					gestureDirection: "vertical",
				}}
			/>
			<Stack.Screen
				name="gesture-bidirectional"
				options={{
					headerShown: false,
					gestureEnabled: true,
					gestureDirection: "bidirectional",
				}}
			/>

			{/* Transition preset screens */}
			<Stack.Screen
				name="preset-slide-top"
				options={{
					headerShown: false,
					...Transition.presets.SlideFromTop(),
				}}
			/>
			<Stack.Screen
				name="preset-zoom-in"
				options={{
					headerShown: false,
					...Transition.presets.ZoomIn(),
				}}
			/>
			<Stack.Screen
				name="preset-elastic-card"
				options={{
					headerShown: false,
					...Transition.presets.ElasticCard({ elasticFactor: 0.3 }),
				}}
			/>

			{/* Edge case screens */}
			<Stack.Screen
				name="rapid-navigation"
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="animation-interruption"
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="custom-callback"
				options={{
					headerShown: false,
				}}
			/>
		</Stack>
	);
}
