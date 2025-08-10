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
					enableTransitions: true,
					screenStyleInterpolator: ({
						current,
						layouts: { screen },
						bounds,
						progress,
						focused,
						activeBoundId,
						next,
					}) => {
						"worklet";
						if (!activeBoundId) return {};

						if (focused) {
							const prev = bounds(activeBoundId)
								.content()
								.contentFill()
								.build();
							const masked = bounds(activeBoundId)
								.absolute()
								.toFullscreen()
								.size()
								.build();

							const x = interpolate(
								current.gesture.normalizedY,
								[-1, 1],
								[-screen.height * 0.25, screen.height * 0.25],
								"clamp",
							);

							const y = interpolate(
								current.gesture.normalizedX,
								[-1, 1],
								[-screen.width * 0.25, screen.width * 0.25],
								"clamp",
							);

							return {
								overlayStyle: {
									backgroundColor: "black",
									opacity: interpolate(progress, [0, 1], [0, 0.5]),
								},
								contentStyle: {
									transform: [{ translateY: x }, { translateX: y }],
								},
								"container-view": prev,
								"masked-view": {
									...masked,
									borderRadius: interpolate(progress, [0, 1], [0, 24]),
								},
							};
						}

						const translateY = interpolate(
							next?.gesture.normalizedY ?? 0,
							[-1, 1],
							[-screen.height * 0.25, screen.height * 0.25],
							"clamp",
						);

						/** Horizontal */
						const translateX = interpolate(
							next?.gesture.normalizedX ?? 0,
							[-1, 1],
							[-screen.width * 0.25, screen.width * 0.25],
							"clamp",
						);

						const unfocusedBound = bounds()
							.gestures({
								x: translateX,
								y: translateY,
							})
							.transform()
							.build();

						return {
							contentStyle: {
								transform: [
									{
										scale: interpolate(progress, [1, 2], [1, 0.9]),
									},
								],
							},
							[activeBoundId]: unfocusedBound,
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
