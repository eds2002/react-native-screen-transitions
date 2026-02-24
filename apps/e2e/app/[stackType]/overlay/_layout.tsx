// @ts-nocheck
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { TabBarOverlay } from "@/components/tab-bar-overlay";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";

export default function BlankStackOverlayLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;
	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
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
					gestureEnabled: true,
					gestureDirection: "vertical",
					...Transition.Presets.SlideFromBottom(),
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
