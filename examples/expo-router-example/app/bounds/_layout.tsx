import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function PresetsLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{
					title: "Bounds",
					contentStyle: {
						backgroundColor: "white",
					},
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="page-transition"
				options={{
					title: "Page Transition",
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: "vertical",
					screenStyleInterpolator: ({
						progress,
						focused,
						bounds,
						layouts: {
							screen: { width, height },
						},
					}) => {
						"worklet";
						if (focused) {
							const prev = bounds.get("previous", "page-transition");

							const animatedHeight = interpolate(
								progress,
								[0, 1],
								[prev.bounds.height, height],
								"clamp",
							);
							const animatedWidth = interpolate(
								progress,
								[0, 1],
								[prev.bounds.width, width],
								"clamp",
							);

							const translateX = interpolate(
								progress,
								[0, 1],
								[prev.bounds.pageX, 0],
								"clamp",
							);
							const translateY = interpolate(
								progress,
								[0, 1],
								[prev.bounds.pageY, 0],
								"clamp",
							);

							return {
								contentStyle: {
									position: "absolute",
									top: 0,
									left: 0,
									flex: 0,
									width: animatedWidth,
									height: animatedHeight,
									transform: [{ translateX }, { translateY }],
									overflow: "hidden",
									opacity: interpolate(progress, [0, 0.05, 1], [0, 1, 1]),
								},
								overlayStyle: {
									opacity: interpolate(progress, [0, 1], [0, 1]),
									backgroundColor: "rgba(0,0,0,0.5)",
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
				name="active-bounds"
				options={{
					title: "Active Bounds",
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="gesture-assisted"
				options={{
					title: "Gesture-Assisted",
					headerShown: false,
				}}
			/>
		</Stack>
	);
}
