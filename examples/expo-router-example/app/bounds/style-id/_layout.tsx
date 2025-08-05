import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function StyleIdLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{ title: "Bounds + Style Id", headerShown: false }}
			/>

			<Stack.Screen
				name="[id]"
				options={{
					gestureEnabled: true,
					gestureDirection: ["vertical"],
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
							const prev = bounds(activeBoundId).toTransformStyle();
							const masked = bounds(activeBoundId)
								.toFullscreen()
								.absolute()
								.toResizeStyle();

							return {
								overlayStyle: {
									backgroundColor: "black",
									opacity: interpolate(progress, [0, 1], [0, 0.5]),
								},
								[activeBoundId]: {
									...prev,
								},
								"masked-view": {
									...masked,
									borderRadius: interpolate(progress, [0, 1], [32, 24]),
								},
							};
						}

						return {
							contentStyle: {
								transform: [
									{
										scale: interpolate(progress, [1, 2], [1, 0.9]),
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
