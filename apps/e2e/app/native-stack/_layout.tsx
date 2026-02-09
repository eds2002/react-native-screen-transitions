import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function NativeStackLayout() {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen
				name="index"
				options={{
					title: "Native Stack Tests",
				}}
			/>
			<Stack.Screen
				name="slide-horizontal"
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
						const translateX = interpolate(
							progress,
							[0, 1, 2],
							[width, 0, -width * 0.3],
						);
						return {
							contentStyle: {
								transform: [{ translateX }],
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
				name="slide-vertical"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: "vertical",
					...Transition.Presets.SlideFromBottom(),
				}}
			/>
			<Stack.Screen
				name="zoom"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: "vertical",
					...Transition.Presets.ZoomIn(),
				}}
			/>
			<Stack.Screen
				name="detail"
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
						const translateX = interpolate(
							progress,
							[0, 1, 2],
							[width, 0, -width * 0.3],
						);
						return {
							contentStyle: {
								transform: [{ translateX }],
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
				name="stack-progress"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<Stack.Screen
				name="overlay"
				options={{
					enableTransitions: true,
					...Transition.Presets.SlideFromBottom(),
				}}
			/>
			<Stack.Screen
				name="deep-link/[id]"
				options={{
					enableTransitions: true,
					...Transition.Presets.SlideFromBottom(),
				}}
			/>
			<Stack.Screen
				name="active-bounds"
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="gesture-bounds"
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="style-id-bounds"
				options={{
					headerShown: false,
				}}
			/>
		</Stack>
	);
}
