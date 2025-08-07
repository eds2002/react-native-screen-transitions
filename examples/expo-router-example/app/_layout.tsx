import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Easing, interpolate, interpolateColor } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function RootLayout() {
	return (
		<GestureHandlerRootView>
			<Stack>
				<Stack.Screen
					name="index"
					options={{
						contentStyle: {
							backgroundColor: "white",
						},
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="presets"
					options={{
						contentStyle: {
							backgroundColor: "white",
						},
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="custom-transitions"
					options={{
						contentStyle: {
							backgroundColor: "white",
						},
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="bounds"
					options={{
						contentStyle: {
							backgroundColor: "white",
						},
						headerShown: false,
					}}
				/>

				<Stack.Screen
					name="nested"
					options={{
						headerShown: false,
						enableTransitions: true,
						...Transition.presets.SlideFromTop(),
					}}
				/>

				<Stack.Screen
					name="mocks/palette-profile"
					options={{
						enableTransitions: true,
						gestureEnabled: true,
						gestureDirection: ["horizontal", "vertical"],
						screenStyleInterpolator: ({
							current,
							layouts: { screen },
							progress,
						}) => {
							"worklet";

							/** Combined */
							const scale = interpolate(progress, [0, 1, 2], [0, 1, 0.75]);
							const borderRadius = interpolate(
								progress,
								[0, 1, 2],
								[36, 36, 36],
							);

							/** Vertical */
							const translateY = interpolate(
								current.gesture.normalizedY,
								[-1, 1],
								[-screen.height * 0.5, screen.height * 0.5],
								"clamp",
							);

							/** Horizontal */
							const translateX = interpolate(
								current.gesture.normalizedX,
								[-1, 1],
								[-screen.width * 0.5, screen.width * 0.5],
								"clamp",
							);

							return {
								contentStyle: {
									transform: [
										{ scale },
										{ translateY: translateY },
										{ translateX },
									],
									borderRadius,
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
					name="mocks/gallery-modal"
					options={{
						enableTransitions: true,
						gestureDirection: "vertical",
						gestureEnabled: true,
						screenStyleInterpolator: ({ current, next, layouts }) => {
							"worklet";

							const unfocusedY = interpolate(
								next?.progress ?? 0,
								[0, 1],
								[0, -100],
							);
							const focusedY = interpolate(
								current?.progress ?? 0,
								[0, 1],
								[layouts.screen.height, 0],
							);

							return {
								contentStyle: {
									transform: [
										{ translateY: focusedY },
										{ translateY: unfocusedY },
									],
								},
							};
						},
						transitionSpec: {
							close: {
								duration: 600,
								easing: Easing.bezierFn(0.19, 1, 0.22, 1),
							},
							open: {
								duration: 600,
								easing: Easing.bezierFn(0.19, 1, 0.22, 1),
							},
						},
					}}
				/>
				<Stack.Screen
					name="mocks/delete-warning"
					options={{
						enableTransitions: true,
						gestureEnabled: true,
						gestureDirection: "vertical",
						screenStyleInterpolator: ({ current, next, layouts }) => {
							"worklet";

							const progress = current.progress + (next?.progress ?? 0);

							const fifthHeight = layouts.screen.height / 5;

							const unfocusedY = interpolate(
								next?.progress ?? 0,
								[0, 1],
								[0, -fifthHeight],
							);
							const focusedY = interpolate(
								current?.progress ?? 0,
								[0, 1],
								[fifthHeight, 0],
							);

							const borderRadius = interpolate(progress, [0, 1, 2], [0, 0, 36]);

							return {
								contentStyle: {
									transform: [
										{ translateY: focusedY },
										{ translateY: unfocusedY },
									],
									borderRadius: borderRadius,
								},
							};
						},
						transitionSpec: {
							close: {
								duration: 600,
								easing: Easing.bezierFn(0.19, 1, 0.22, 1),
							},
							open: {
								duration: 600,
								easing: Easing.bezierFn(0.19, 1, 0.22, 1),
							},
						},
					}}
				/>
				<Stack.Screen
					name="mocks/fullscreen-nav"
					options={{
						enableTransitions: true,
						screenStyleInterpolator: ({ current, next }) => {
							"worklet";

							const overlay = interpolateColor(
								current.progress,
								[0, 1],
								["rgba(0,0,0,0)", "rgba(0,0,0,0.85)"],
							);

							return {
								overlayStyle: {
									backgroundColor: !next ? overlay : "rgba(0,0,0,0)",
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
					name="examples/settings-screen"
					options={{
						...Transition.presets.SlideFromTop(),
						transitionSpec: {
							open: {
								duration: 300,
								easing: Easing.bezierFn(0.6, 1.23, 0.42, 1),
							},
							close: {
								duration: 300,
								easing: Easing.bezierFn(0.6, 1.23, 0.42, 1),
							},
						},
					}}
				/>
				<Stack.Screen
					name="examples/settings-modal"
					options={{
						enableTransitions: true,
						gestureEnabled: true,
						gestureDirection: "vertical",
						screenStyleInterpolator: ({
							focused,
							progress,
							layouts: { screen },
							insets,
						}) => {
							"worklet";

							if (focused) {
								const y = interpolate(progress, [0, 1], [screen.height, 0]);
								const overlay = interpolateColor(
									progress,
									[0, 1],
									["rgba(0,0,0,0)", "rgba(0,0,0,0.5)"],
								);
								return {
									overlayStyle: {
										backgroundColor: overlay,
									},
									contentStyle: {
										transform: [{ translateY: y }],

										backgroundColor: "#fff",
										margin: 16,
										marginBottom: insets.bottom,
										marginTop: "auto",
										flex: 0.9,
										borderRadius: 36,
										overflow: "hidden",
									},
								};
							}

							return {};
						},
						transitionSpec: {
							open: Transition.specs.DefaultSpec,
							close: Transition.specs.DefaultSpec,
						},
					}}
				/>
			</Stack>
		</GestureHandlerRootView>
	);
}
