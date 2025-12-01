import { withTiming } from "react-native-reanimated";
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
						activeBoundId,
						current,

						active,
					}) => {
						"worklet";

						/**
						 * Bounds are designed to work between unfocused & focused screen. While this approach is okay, it realy just gives off a lazy feel. I would recommend separating the bound animations by the focused prop.
						 */

						const boundStyles = bounds({
							gestures: {
								x: active.gesture.x,
								y: active.gesture.y,
							},
						});

						return {
							[activeBoundId]: {
								...boundStyles,
								opacity: withTiming(current.gesture.isDragging ? 0.5 : 1),
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</Stack>
	);
}
