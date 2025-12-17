import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import { TabBarOverlay } from "@/components/tab-bar-overlay";

export default function BlankStackOverlayLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen
				name="index"
				options={{
					overlay: TabBarOverlay,
					overlayMode: "float",
					overlayShown: true,
				}}
			/>
			<BlankStack.Screen
				name="second"
				options={{
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
			<BlankStack.Screen
				name="third"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					...Transition.Presets.SlideFromBottom(),
					// Overlay still visible on this screen
					overlay: TabBarOverlay,
					overlayMode: "float",
					overlayShown: true,
				}}
			/>
			<BlankStack.Screen
				name="no-overlay"
				options={{
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
		</BlankStack>
	);
}
