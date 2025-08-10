import { interpolate, interpolateColor } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function RootLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ headerShown: false }} />
			<Stack.Screen
				name="[id]"
				options={{
					headerShown: false,
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted"],
					gestureDrivesProgress: false,
					screenStyleInterpolator: ({
						focused,
						activeBoundId,
						bounds,
						current,
					}) => {
						"worklet";
						if (focused && activeBoundId) {
							const boundStyles = bounds().transform().build();

							return {
								[activeBoundId]: {
									...boundStyles,
									borderRadius: interpolate(current.progress, [0, 1], [12, 0]),
									overflow: "hidden",
								},
								contentStyle: {
									transform: [
										{
											translateY: current.gesture.y,
										},
									],
								},
								overlayStyle: {
									backgroundColor: interpolateColor(
										current.progress - Math.abs(current.gesture.normalizedY),
										[0, 1],
										["rgba(0,0,0,0)", "rgba(0,0,0,1)"],
									),
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
	);
}
