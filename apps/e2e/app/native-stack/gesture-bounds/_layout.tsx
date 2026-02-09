import { withTiming } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { create } from "zustand";
import { Stack } from "@/layouts/stack";

export const useGestureBoundsStore = create<{ boundTag: string }>(() => ({
	boundTag: "",
}));

export default function GestureBoundsLayout() {
	const boundTag = useGestureBoundsStore((s) => s.boundTag);

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="index" />
			<Stack.Screen
				name="[id]"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: ["vertical"],
					gestureDrivesProgress: false,
					screenStyleInterpolator: ({ bounds, current, active }) => {
						"worklet";

						const boundStyles = bounds({
							id: boundTag,
							gestures: {
								x: active.gesture.x,
								y: active.gesture.y,
							},
							target: "fullscreen",
						});

						return {
							[boundTag]: {
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
