// @ts-nocheck
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { TabBarOverlay } from "@/components/tab-bar-overlay";
import { BlankStack } from "@/layouts/blank-stack";
import { IOSSlide } from "@/lib/screen-transitions/ios-slide";

export default function BlankStackOverlayLayout() {
	const StackNavigator = BlankStack;
	return (
		<StackNavigator>
			<StackNavigator.Screen
				name="index"
				options={{
					overlay: TabBarOverlay,
					overlayMode: "float",
					overlayShown: true,
				}}
			/>
			<StackNavigator.Screen
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
							content: {
								style: {
									transform: [{ translateX }],
								},
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
			<StackNavigator.Screen
				name="third"
				options={{
					...IOSSlide(),
					// Overlay still visible on this screen
					overlay: TabBarOverlay,
					overlayMode: "float",
					overlayShown: true,
				}}
			/>
			<StackNavigator.Screen
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
							content: {
								style: {
									transform: [{ translateX }],
								},
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
		</StackNavigator>
	);
}
