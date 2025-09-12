import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function PresetsLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{
					title: "Presets",
					contentStyle: {
						backgroundColor: "white",
					},
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="ios-card-horizontal"
				options={{
					title: "IOS Card Horizontal",
					enableTransitions: true,
					screenStyleInterpolator: ({
						progress,
						focused,
						layouts: {
							screen: { width },
						},
					}) => {
						"worklet";

						const x = interpolate(
							progress,
							[0, 1, 2],
							[width, 0, -width * 0.3],
						);

						return {
							contentStyle: {
								transform: [{ translateX: x }],
							},
							overlayStyle: {
								opacity: focused ? interpolate(progress, [0, 1], [0, 1]) : 0,
								backgroundColor: focused ? "rgba(0,0,0,0.5)" : "transparent",
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
				name="gestures"
				options={{
					title: "IOS Card Horizontal with Gestures",
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: "horizontal",
					screenStyleInterpolator: ({
						progress,
						focused,
						layouts: {
							screen: { width },
						},
					}) => {
						"worklet";

						const x = interpolate(
							progress,
							[0, 1, 2],
							[width, 0, -width * 0.3],
							"clamp",
						);

						if (focused) {
							console.log("progress", progress);
						}

						return {
							contentStyle: {
								transform: [{ translateX: x }],
							},
							overlayStyle: {
								opacity: focused ? interpolate(progress, [0, 1], [0, 1]) : 0,
								backgroundColor: focused ? "rgba(0,0,0,0.5)" : "transparent",
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
				name="screen-level"
				options={{
					title: "Screen Level Animations",
					enableTransitions: true,
					screenStyleInterpolator: ({
						progress,
						focused,
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
							overlayStyle: {
								opacity: focused ? interpolate(progress, [0, 1], [0, 1]) : 0,
								backgroundColor: focused ? "rgba(0,0,0,0.5)" : "transparent",
							},
						};
					},
					transitionSpec: {
						open: { duration: 1000 },
						close: { duration: 1000 },
					},
				}}
			/>
			<Stack.Screen
				name="ios-card-vertical"
				options={{
					title: "IOS Card Vertical",
					enableTransitions: true,
					screenStyleInterpolator: ({
						progress,
						focused,
						layouts: {
							screen: { height },
						},
					}) => {
						"worklet";

						const y = interpolate(
							progress,
							[0, 1, 2],
							[height, 0, -height * 0.3],
						);

						return {
							contentStyle: {
								transform: [{ translateY: y }],
							},
							overlayStyle: {
								opacity: focused ? interpolate(progress, [0, 1], [0, 1]) : 0,
								backgroundColor: focused ? "rgba(0,0,0,0.5)" : "transparent",
							},
						};
					},
					transitionSpec: {
						open: Transition.specs.DefaultSpec,
						close: Transition.specs.DefaultSpec,
					},
				}}
			/>
		</Stack>
	);
}
