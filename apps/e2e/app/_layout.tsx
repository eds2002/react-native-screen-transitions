// @ts-nocheck

import { LogBox } from "react-native";
import SquircleView from "react-native-fast-squircle";
import { interpolate } from "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import { IOSSlide } from "@/lib/screen-transitions/ios-slide";
import { observerRootInterpolator } from "./observer/interpolators";

LogBox.ignoreAllLogs();

const stackScreen = (name: string) => `blank-stack/${name}`;

export default function RootLayout() {
	return (
		<SafeAreaProvider>
			<BlankStack>
				<BlankStack.Screen name="index" />
				<BlankStack.Screen
					name={stackScreen("slide-vertical")}
					options={{
						gestureEnabled: true,
						gestureDirection: "vertical",
						...Transition.Presets.SlideFromBottom(),
					}}
				/>
				<BlankStack.Screen
					name={stackScreen("slide-top")}
					options={{ ...Transition.Presets.SlideFromTop() }}
				/>
				<BlankStack.Screen
					name={stackScreen("zoom-in")}
					options={{ ...Transition.Presets.ZoomIn() }}
				/>
				<BlankStack.Screen
					name={stackScreen("draggable-card")}
					options={{
						gestureEnabled: true,
						...Transition.Presets.DraggableCard(),
					}}
				/>
				<BlankStack.Screen
					name={stackScreen("elastic-card")}
					options={{
						gestureEnabled: true,
						...Transition.Presets.ElasticCard(),
					}}
				/>
				<BlankStack.Screen
					name={stackScreen("detail")}
					options={{ ...IOSSlide() }}
				/>
				<BlankStack.Screen
					name={stackScreen("stack-progress")}
					options={{ ...IOSSlide() }}
				/>
				<BlankStack.Screen
					name={stackScreen("inactive-behavior")}
					options={{ ...IOSSlide() }}
				/>
				<BlankStack.Screen
					name={stackScreen("overlay")}
					options={{ ...IOSSlide() }}
				/>
				<BlankStack.Screen
					name={stackScreen("custom-background")}
					options={{
						gestureEnabled: true,
						gestureDirection: "vertical",
						contentComponent: SquircleView,
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
				<BlankStack.Screen
					name={stackScreen("bottom-sheet")}
					options={{ ...IOSSlide() }}
				/>
				<BlankStack.Screen
					name={stackScreen("gestures")}
					options={{ ...IOSSlide() }}
				/>
				<BlankStack.Screen
					name={stackScreen("bounds")}
					options={{ ...IOSSlide() }}
				/>
				<BlankStack.Screen
					name={stackScreen("backdrop")}
					options={{ ...IOSSlide() }}
				/>
				<BlankStack.Screen name="presets/index" options={{ ...IOSSlide() }} />
				<BlankStack.Screen name="maestro" options={{ animation: "none" }} />
				<BlankStack.Screen name="backdrop" options={{ ...IOSSlide() }} />
				<BlankStack.Screen name="example" options={{ ...IOSSlide() }} />
				<BlankStack.Screen
					name="observer"
					options={{
						transitionKey: "observer-root",
						gestureEnabled: true,
						gestureDirection: "horizontal",
						screenStyleInterpolator: observerRootInterpolator,
						transitionSpec: {
							open: Transition.Specs.DefaultSpec,
							close: Transition.Specs.DefaultSpec,
						},
					}}
				/>
				<BlankStack.Screen
					name="native-stack-adapter-recipe"
					options={{ ...IOSSlide() }}
				/>
				<BlankStack.Screen
					name="gesture-velocity-recipe"
					options={{ ...IOSSlide() }}
				/>
				<BlankStack.Screen name="gestures" />
			</BlankStack>
		</SafeAreaProvider>
	);
}
