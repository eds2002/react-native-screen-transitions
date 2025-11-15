import { Stack } from "@/layouts/stack";

import "react-native-reanimated";
import * as reactNativeReanimated from "react-native-reanimated";
import Transition from "react-native-screen-transitions";

export default function RootLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="e2e/navigation"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: "horizontal",
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { width },
						},
					}) => {
						"worklet";

						const x = reactNativeReanimated.interpolate(
							progress,
							[0, 1, 2],
							[width, 0, -width],
						);

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
			<Stack.Screen
				name="e2e/gestures/all-gesture-directions"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: [
						"horizontal",
						"vertical",
						"horizontal-inverted",
						"vertical-inverted",
					],
					screenStyleInterpolator: ({
						progress,
						current,
						layouts: {
							screen: { width, height },
						},
						focused,
					}) => {
						"worklet";

						const scale = reactNativeReanimated.interpolate(
							progress,
							[0, 1, 2],
							[0, 1, 0.75],
						);
						const gestureX = reactNativeReanimated.interpolate(
							current.gesture.normalizedX,
							[-1, 0, 1],
							[-width, 0, width],
						);

						const y = reactNativeReanimated.interpolate(
							current.gesture.normalizedY,
							[-1, 0, 1],
							[-height, 0, height],
						);

						return {
							contentStyle: {
								transform: [
									{ scale },
									{ translateX: gestureX },
									{ translateY: y },
								],
								...(focused && {
									backgroundColor: "lightblue",
								}),
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<Stack.Screen
				name="e2e/gestures/bi-directional"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: [
						"horizontal",
						"vertical",
						"horizontal-inverted",
						"vertical-inverted",
					],
					screenStyleInterpolator: ({
						progress,
						current,
						layouts: {
							screen: { width, height },
						},
						focused,
					}) => {
						"worklet";

						const scale = reactNativeReanimated.interpolate(
							progress,
							[0, 1, 2],
							[0, 1, 0.75],
						);
						const gestureX = reactNativeReanimated.interpolate(
							current.gesture.normalizedX,
							[-1, 0, 1],
							[-width, 0, width],
						);

						const y = reactNativeReanimated.interpolate(
							current.gesture.normalizedY,
							[-1, 0, 1],
							[-height, 0, height],
						);

						return {
							contentStyle: {
								transform: [
									{ scale },
									{ translateX: gestureX },
									{ translateY: y },
								],
								...(focused && {
									backgroundColor: "lightblue",
								}),
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<Stack.Screen
				name="e2e/gestures/gesture-dismissal"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: ["vertical"],
					screenStyleInterpolator: ({
						progress,
						current,
						layouts: {
							screen: { height, width },
						},
					}) => {
						"worklet";

						const y = reactNativeReanimated.interpolate(
							progress,
							[0, 1, 2],
							[height, 0, -height],
						);

						const gestureX = reactNativeReanimated.interpolate(
							current.gesture.normalizedX,
							[-1, 0, 1],
							[-width, 0, width],
						);

						const gestureY = reactNativeReanimated.interpolate(
							current.gesture.normalizedY,
							[-1, 0, 1],
							[-height, 0, height],
						);

						return {
							contentStyle: {
								transform: [
									{ translateY: y },
									{ translateX: gestureX },
									{ translateY: gestureY },
								],
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<Stack.Screen
				name="e2e/gestures-scrollables/vertical"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted"],
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { height },
						},
					}) => {
						"worklet";

						const y = reactNativeReanimated.interpolate(
							progress,
							[0, 1, 2],
							[height, 0, -height],
						);

						return {
							contentStyle: {
								transform: [{ translateY: y }],
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<Stack.Screen
				name="e2e/gestures-scrollables/horizontal"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: ["horizontal", "horizontal-inverted"],
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { width },
						},
					}) => {
						"worklet";

						const x = reactNativeReanimated.interpolate(
							progress,
							[0, 1, 2],
							[width, 0, -width],
						);

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
			<Stack.Screen
				name="e2e/gestures-scrollables/nested"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: "vertical",
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { height },
						},
					}) => {
						"worklet";

						const y = reactNativeReanimated.interpolate(
							progress,
							[0, 1, 2],
							[height, 0, -height],
						);

						return {
							contentStyle: {
								transform: [{ translateY: y }],
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<Stack.Screen
				name="e2e/gesture-edges/all-edges"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: "bidirectional",
					gestureActivationArea: "edge",
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { height },
						},
					}) => {
						"worklet";

						const y = reactNativeReanimated.interpolate(
							progress,
							[0, 1, 2],
							[height, 0, -height],
						);

						return {
							contentStyle: {
								transform: [{ translateY: y }],
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<Stack.Screen
				name="e2e/gesture-edges/custom-edges"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: ["horizontal", "vertical"],
					gestureActivationArea: {
						left: "edge",
						top: "screen",
					},
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { height },
						},
					}) => {
						"worklet";

						const y = reactNativeReanimated.interpolate(
							progress,
							[0, 1, 2],
							[height, 0, -height],
						);

						return {
							contentStyle: {
								transform: [{ translateY: y }],
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<Stack.Screen
				name="e2e/bounds/anchor-point"
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="e2e/bounds/custom-bounds"
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="e2e/bounds/longer-flow"
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="e2e/nested"
				options={{
					presentation: "modal",
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="examples/apple-music/(tabs)"
				options={{
					headerShown: false,
				}}
			/>
		</Stack>
	);
}
