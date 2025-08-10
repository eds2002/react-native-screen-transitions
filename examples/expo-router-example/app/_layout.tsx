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

				{/*
        ==============================
        EXAMPLES ROUTES
        ==============================
        */}
				<Stack.Screen
					name="examples/palette-profile"
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
					name="examples/gallery-modal"
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
					name="examples/delete-warning"
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
					name="examples/fullscreen-nav"
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
								duration: 350,
								easing: Easing.bezierFn(0.6, 1.23, 0.42, 1),
							},
							close: {
								duration: 350,
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
				<Stack.Screen
					name="examples/x"
					options={{
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="examples/instagram"
					options={{
						headerShown: false,
					}}
				/>
				{/*
        ==============================
        E2E ROUTES
        ==============================
        */}
				<Stack.Screen
					name="e2e/navigation"
					options={{
						enableTransitions: true,
						gestureEnabled: true,
						gestureDirection: "horizontal",
						screenStyleInterpolator: ({
							focused,
							progress,
							layouts: {
								screen: { width },
							},
						}) => {
							"worklet";
							if (focused) {
								console.log("focused", progress);
								return {
									contentStyle: {
										transform: [
											{ translateX: interpolate(progress, [0, 1], [width, 0]) },
										],
									},
								};
							}

							console.log("progress", progress);

							const x = interpolate(progress, [0, 1, 2], [width, 0, -width]);

							return {
								contentStyle: {
									transform: [{ translateX: x }],
								},
							};
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
							};
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
							};
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
							layouts: {
								screen: { height },
							},
						}) => {
							"worklet";

							const y = interpolate(progress, [0, 1, 2], [height, 0, -height]);

							return {
								contentStyle: {
									transform: [{ translateY: y }],
								},
							};
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

							const y = interpolate(progress, [0, 1, 2], [height, 0, -height]);

							return {
								contentStyle: {
									transform: [{ translateY: y }],
								},
							};
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

							const x = interpolate(progress, [0, 1, 2], [width, 0, -width]);

							return {
								contentStyle: {
									transform: [{ translateX: x }],
								},
							};
						},
					}}
				/>
			</Stack>
		</GestureHandlerRootView>
	);
}
