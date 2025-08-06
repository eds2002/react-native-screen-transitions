import { interpolate, interpolateColor } from "react-native-reanimated";
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
					gestureDirection: ["vertical"],
					gestureDrivesProgress: false,
					enableTransitions: true,
					screenStyleInterpolator: ({
						bounds,
						progress,
						focused,
						activeBoundId,
						current,
						next,
					}) => {
						"worklet";

						if (!activeBoundId) return {};

						if (focused) {
							const animatingBound = bounds(activeBoundId)
								.toFullscreen()
								.withGestures({
									x: current.gesture.x,
									y: current.gesture.y,
								})
								.toTransformStyle();

							return {
								[activeBoundId]: {
									...animatingBound,
									flex: 1,
									backgroundColor: interpolateColor(
										progress,
										[0, 1],
										["red", "white"],
									),
									opacity: interpolate(progress, [0, 0.99], [0, 1]),
								},
								overlayStyle: {
									backgroundColor: "#000",
									opacity: interpolate(progress, [0, 1], [0, 0.75]),
								},
							};
						}

						const boundsStyle = bounds(activeBoundId)
							.toFullscreen()
							.withGestures({
								x: next?.gesture?.x ?? 0,
								y: next?.gesture?.y ?? 0,
							})
							.toTransformStyle();

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
								opacity: interpolate(progress, [1.99, 2], [1, 0]),
								zIndex: next?.animating === 1 ? 1000 : -1,
								position: "relative",
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
