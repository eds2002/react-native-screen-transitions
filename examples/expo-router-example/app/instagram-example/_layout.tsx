import {
	Easing,
	interpolate,
	interpolateColor,
	withDecay,
} from "react-native-reanimated";
import { opacity } from "react-native-reanimated/lib/typescript/Colors";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function BoundsExampleLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{
					skipDefaultScreenOptions: true,
					headerShown: false,
					freezeOnBlur: true,
				}}
			/>
			<Stack.Screen
				name="[id]"
				options={{
					title: "B",
					gestureEnabled: true,
					gestureDirection: ["vertical", "horizontal", "vertical-inverted"],
					gestureDrivesProgress: false,
					screenStyleInterpolator: ({
						bounds,

						current,
						previous,
						isFocused,
						progress,
						next,
						layouts: { screen },
					}) => {
						"worklet";

						if (!bounds.activeTag) return {};

						const MAX_DRAG_MULTIPLIER = 0.9;

						const modWidth = screen.width * MAX_DRAG_MULTIPLIER;
						const modHeight = screen.height * MAX_DRAG_MULTIPLIER;

						if (isFocused) {
							const currentGestureX = current?.gesture.normalizedX.value ?? 0;
							const currentGestureY = current?.gesture.normalizedY.value ?? 0;
							const gestureX = interpolate(
								currentGestureX,
								[-1, 1],
								[-modWidth, modWidth],
								"clamp",
							);
							const gestureY = interpolate(
								currentGestureY,
								[-1, 1],
								[-modHeight, modHeight],
								"clamp",
							);

							const start = previous?.bounds.all[bounds.activeTag]?.value;
							const end = current?.bounds.all[bounds.activeTag]?.value;

							// The bounds of the full screen we are animating TO.

							if (!start) return {};
							if (!end) return {};

							const translateX = (start.pageX - end.pageX) / screen.width;
							const translateY = (start.pageY - end.pageY) / screen.height;

							const contentStyle = {
								transform: [
									// At progress=0, apply the full transform. At progress=1, apply no transform.
									{
										translateX: interpolate(progress, [0, 1], [translateX, 0]),
									},
									{
										translateY: interpolate(progress, [0, 1], [translateY, 0]),
									},
									{
										translateX: gestureX,
									},
									{
										translateY: gestureY,
									},
									{
										opacity: interpolate(progress, [0, 1], [0, 1]),
									},
								],
							};

							const maskStyle = {
								position: "absolute",
								backgroundColor: "black",
								left: interpolate(progress, [0, 1], [start.pageX, 0]),
								top: interpolate(progress, [0, 1], [start.pageY, 0]),
								width: interpolate(
									progress,
									[0, 1],
									[start.width, screen.width],
								),
								height: interpolate(
									progress,
									[0, 1],
									[start.height, screen.height],
								),
								opacity: current.gesture.isDismissing.value
									? interpolate(progress, [0, 1], [0, 1])
									: 1,
							};

							return {
								"ig-mask": maskStyle,
								contentStyle,
							};
						}

						const nextGestureX = next?.gesture.normalizedX.value ?? 0;
						const nextGestureY = next?.gesture.normalizedY.value ?? 0;

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
							.opacity([1, 1])
							.build();

						return {
							[bounds.activeTag]: { ...boundsStyle, zIndex: 1000 },
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
