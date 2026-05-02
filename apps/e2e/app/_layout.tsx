// @ts-nocheck
import { useState } from "react";
import SquircleView from "react-native-fast-squircle";
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import type { StackType } from "@/components/stack-examples/stack-routing";
import { StackSelectionContext } from "@/components/stack-examples/stack-selection";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { IOSSlide } from "@/lib/screen-transitions/ios-slide";

const stackScreen = (name: string) => `[stackType]/${name}`;

export default function RootLayout() {
	const [stackType, setStackType] = useState<StackType>("blank-stack");
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	// Native stack support uses transparent modals today. It is useful for one-off custom
	// animations in an existing native-stack tree, but should move to true native
	// animations in the next major.
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackSelectionContext.Provider value={{ stackType, setStackType }}>
			<StackNavigator screenOptions={navigatorScreenOptions}>
				<StackNavigator.Screen name="index" />
				<StackNavigator.Screen
					name={stackScreen("slide-vertical")}
					options={{
						gestureEnabled: true,
						gestureDirection: "vertical",
						...Transition.Presets.SlideFromBottom(),
					}}
				/>
				<StackNavigator.Screen
					name={stackScreen("slide-top")}
					options={{ ...Transition.Presets.SlideFromTop() }}
				/>
				<StackNavigator.Screen
					name={stackScreen("zoom-in")}
					options={{ ...Transition.Presets.ZoomIn() }}
				/>
				<StackNavigator.Screen
					name={stackScreen("draggable-card")}
					options={{
						gestureEnabled: true,
						...Transition.Presets.DraggableCard(),
					}}
				/>
				<StackNavigator.Screen
					name={stackScreen("elastic-card")}
					options={{
						gestureEnabled: true,
						...Transition.Presets.ElasticCard(),
					}}
				/>
				<StackNavigator.Screen
					name={stackScreen("shared-x-image")}
					options={{ ...IOSSlide() }}
				/>
				<StackNavigator.Screen
					name={stackScreen("detail")}
					options={{ ...IOSSlide() }}
				/>
				<StackNavigator.Screen
					name={stackScreen("stack-progress")}
					options={{ ...IOSSlide() }}
				/>
				<StackNavigator.Screen
					name={stackScreen("overlay")}
					options={{ ...IOSSlide() }}
				/>
				<StackNavigator.Screen
					name={stackScreen("custom-background")}
					options={{
						gestureEnabled: true,
						gestureDirection: "vertical",
						surfaceComponent: SquircleView,
						screenStyleInterpolator: ({ progress, active }) => {
							"worklet";
							return {
								content: {
									style: {
										transform: [
											{
												scale: interpolate(
													progress,
													[0, 1, 2],
													[0, 1, 0.9],
													"clamp",
												),
											},
										],
									},
								},
								surface: {
									style: {
										backgroundColor: "#4A90E2",
										borderRadius: active.animating ? 48 : 0,
										overflow: "hidden",
									},
									props: {
										cornerSmoothing: 1,
									},
								},
							};
						},
						transitionSpec: {
							open: Transition.Specs.DefaultSpec,
							close: Transition.Specs.DefaultSpec,
						},
					}}
				/>
				<StackNavigator.Screen
					name={stackScreen("bottom-sheet")}
					options={{ ...IOSSlide() }}
				/>
				<StackNavigator.Screen
					name={stackScreen("gestures")}
					options={{ ...IOSSlide() }}
				/>
				<StackNavigator.Screen
					name={stackScreen("bounds")}
					options={{ ...IOSSlide() }}
				/>
				<StackNavigator.Screen
					name={stackScreen("backdrop")}
					options={{ ...IOSSlide() }}
				/>
				<StackNavigator.Screen
					name="presets/index"
					options={{ ...IOSSlide() }}
				/>
				<StackNavigator.Screen name="backdrop" options={{ ...IOSSlide() }} />
				<StackNavigator.Screen name="stack-benchmark" />
				<StackNavigator.Screen name="gestures" />
				<StackNavigator.Screen
					name="stack-benchmark/[impl]"
					options={{ animation: "none" }}
				/>
			</StackNavigator>
		</StackSelectionContext.Provider>
	);
}
