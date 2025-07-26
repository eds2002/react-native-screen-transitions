import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
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
						skipDefaultScreenOptions: true,
						presentation: "card",
						headerShown: true,
					}}
				/>
				<Stack.Screen
					name="a"
					options={{
						...Transition.presets.SlideFromTop(),
					}}
				/>
				<Stack.Screen
					name="b"
					options={{
						...Transition.presets.ZoomIn(),
					}}
				/>
				<Stack.Screen
					name="c"
					options={{
						...Transition.presets.SlideFromBottom(),
					}}
				/>
				<Stack.Screen
					name="d"
					options={{
						...Transition.presets.DraggableCard(),
					}}
				/>
				<Stack.Screen
					name="e"
					options={{
						...Transition.presets.ElasticCard(),
					}}
				/>
				<Stack.Screen
					name="group-a"
					options={{
						...Transition.presets.DraggableCard(),
					}}
				/>
				<Stack.Screen name="custom" />
				<Stack.Screen
					name="nested"
					options={{
						...Transition.presets.SlideFromTop(),
					}}
				/>

				{/* PALETTE PROFILE */}
				<Stack.Screen
					name="mocks/palette-profile"
					options={{
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
								current.gesture.normalizedY.value,
								[-1, 1],
								[-screen.height * 0.5, screen.height * 0.5],
								"clamp",
							);

							/** Horizontal */
							const translateX = interpolate(
								current.gesture.normalizedX.value,
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
						gestureDirection: "vertical",
						gestureEnabled: true,
						screenStyleInterpolator: ({ current, next, layouts }) => {
							"worklet";

							const unfocusedY = interpolate(
								next?.progress.value ?? 0,
								[0, 1],
								[0, -100],
							);
							const focusedY = interpolate(
								current?.progress.value ?? 0,
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
						gestureEnabled: true,
						gestureDirection: "vertical",
						screenStyleInterpolator: ({ current, next, layouts }) => {
							"worklet";

							const progress =
								current.progress.value + (next?.progress.value ?? 0);

							const fifthHeight = layouts.screen.height / 5;

							const unfocusedY = interpolate(
								next?.progress.value ?? 0,
								[0, 1],
								[0, -fifthHeight],
							);
							const focusedY = interpolate(
								current?.progress.value ?? 0,
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
						screenStyleInterpolator: ({ current, next }) => {
							"worklet";

							const overlay = interpolateColor(
								current.progress.value,
								[0, 1],
								["rgba(0,0,0,0)", "rgba(0,0,0,0.85)"],
							);

							return {
								overlayStyle: {
									backgroundColor: !next ? overlay : "rgba(0,0,0,0)",
								},
							};
						},
					}}
				/>
			</Stack>
		</GestureHandlerRootView>
	);
}
