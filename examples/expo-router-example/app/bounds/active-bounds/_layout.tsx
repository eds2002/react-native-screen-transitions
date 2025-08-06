import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function ActiveBoundsLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{ title: "Active Bounds", headerShown: false }}
			/>
			<Stack.Screen
				name="[id]"
				options={{
					gestureEnabled: true,
					gestureDirection: ["bidirectional"],
					gestureDrivesProgress: false,
					enableTransitions: true,
					screenStyleInterpolator: ({
						bounds,
						progress,

						focused,
						activeBoundId,
					}) => {
						"worklet";

						if (!activeBoundId) return {};

						if (focused) {
							const transform = bounds().relative().toResizeStyle();

							return {
								[activeBoundId]: {
									...transform,
									overflow: "hidden",
									backgroundColor: "red",
								},
								overlayStyle: {
									backgroundColor: "#FFF",
									opacity: interpolate(progress, [0, 1], [0, 0.5]),
								},
							};
						}

						return {
							contentStyle: {
								transform: [
									{
										scale: interpolate(progress, [1, 2], [1, 0.95]),
									},
								],
							},
						};
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
