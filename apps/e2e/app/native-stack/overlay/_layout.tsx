import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";
import { TabBarOverlay } from "@/components/tab-bar-overlay";

export default function NativeStackOverlayLayout() {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen
				name="index"
				options={{
					enableTransitions: true,
					overlay: TabBarOverlay,
					overlayMode: "float",
					overlayShown: true,
				}}
			/>
			<Stack.Screen
				name="second"
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
					// Inherit overlay from previous screen
					overlay: TabBarOverlay,
					overlayMode: "float",
					overlayShown: true,
				}}
			/>
			<Stack.Screen
				name="third"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: "vertical",
					...Transition.Presets.SlideFromBottom(),
					// Overlay still visible on this screen
					overlay: TabBarOverlay,
					overlayMode: "float",
					overlayShown: true,
				}}
			/>
			<Stack.Screen
				name="no-overlay"
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
					// No overlay on this screen
					overlayShown: false,
				}}
			/>
		</Stack>
	);
}
