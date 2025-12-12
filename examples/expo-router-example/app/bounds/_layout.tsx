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
					screenStyleInterpolator: ({ focused, bounds }) => {
						"worklet";
						if (focused) {
							const transform = bounds({
								id: "page-transition",
								method: "size",
								space: "absolute",
								target: "fullscreen",
							});

							return {
								contentStyle: {
									...transform,
									position: "absolute",
									top: 0,
									left: 0,
									flex: 0,
									overflow: "hidden",
								},
								overlayStyle: {
									backgroundColor: "rgba(0,0,0,0.5)",
								},
							};
						}

						return {};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
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
			<Stack.Screen
				name="style-id"
				options={{
					title: "Bounds + Style Id",
					headerShown: false,
				}}
			/>
		</Stack>
	);
}
