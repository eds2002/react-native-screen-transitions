import {
	interpolate,
	interpolateColor,
	withTiming,
} from "react-native-reanimated";
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
						next,
						focused,
					}) => {
						"worklet";

						if (!activeBoundId) return {};

						/**
						 * Bounds are designed to work between unfocused & focused screen. While this approach is okay, it realy just gives off a lazy feel. I would recommend separating the bound animations by the focused prop.
						 */
						const animatingBound = bounds(activeBoundId)
							.toFullscreen()
							.gestures({
								x: focused ? current.gesture.x : next?.gesture.x,
								y: focused ? current.gesture.y : next?.gesture.y,
							})
							.transform()
							.build();

						return {
							// contentStyle:{...}
							// overlayStyle:{...}

							[activeBoundId]: {
								...animatingBound,
								opacity: withTiming(current.gesture.isDragging ? 0.5 : 1),
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
