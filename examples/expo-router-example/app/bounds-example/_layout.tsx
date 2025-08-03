import { Easing, interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function BoundsExampleLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="[id]"
				options={{
					title: "B",
					gestureEnabled: true,
					gestureDirection: ["bidirectional"],
					gestureDrivesProgress: false,
					enableTransitions: true,
					screenStyleInterpolator: ({
						bounds,
						current,
						progress,
						next,
						layouts: { screen },
						focused,
						activeBoundId,
					}) => {
						"worklet";

						if (!activeBoundId) return {};

						const MAX_DRAG_MULTIPLIER = 0.9;

						const modWidth = screen.width * MAX_DRAG_MULTIPLIER;
						const modHeight = screen.height * MAX_DRAG_MULTIPLIER;

						if (focused) {
							const normalizedX = current.gesture.normalizedX;
							const normalizedY = current.gesture.normalizedY;

							const gestureX = interpolate(
								normalizedX,
								[-1, 1],
								[-modWidth, modWidth],
								"clamp",
							);

							const gestureY = interpolate(
								normalizedY,
								[-1, 1],
								[-modHeight, modHeight],
								"clamp",
							);

							const boundsStyle = bounds()
								.start("previous")
								.end("current")
								.x(gestureX)
								.y(gestureY)
								.opacity([1, 1])
								.isEntering()
								.build();

							return {
								[activeBoundId]: {
									...boundsStyle,
									borderTopLeftRadius: interpolate(progress, [0, 1], [100, 50]),
									borderTopRightRadius: interpolate(
										progress,
										[0, 1],
										[100, 50],
									),
									borderBottomLeftRadius: interpolate(
										progress,
										[0, 1],
										[100, 50],
									),
									borderBottomRightRadius: interpolate(
										progress,
										[0, 1],
										[100, 50],
									),
									overflow: "hidden",
								},
								overlayStyle: {
									backgroundColor: "#FFF",
									opacity: interpolate(progress, [0, 1], [0, 0.5]),
								},
							};
						}

						const nextGestureX = next?.gesture.normalizedX ?? 0;
						const nextGestureY = next?.gesture.normalizedY ?? 0;

						const gestureX = interpolate(
							nextGestureX,
							[-1, 1],
							[-modWidth, modWidth],
							"clamp",
						);

						const gestureY = interpolate(
							nextGestureY,
							[-1, 1],
							[-modHeight, modHeight],
							"clamp",
						);

						const boundsStyle = bounds()
							.start("current")
							.end("next")
							.x(gestureX)
							.y(gestureY)
							.isExiting()
							.build();

						return {
							contentStyle: {
								transform: [
									{
										scale: interpolate(progress, [1, 2], [1, 0.95]),
									},
								],
							},
							[activeBoundId]: {
								...boundsStyle,
								opacity: interpolate(progress, [1, 1.5], [1, 0]),
							},
						};
					},
					transitionSpec: {
						open: Transition.specs.DefaultSpec,
						close: {
							duration: 1000,
							easing: Easing.bezierFn(0.19, 1, 0.22, 1),
						},
					},
				}}
			/>
		</Stack>
	);
}
