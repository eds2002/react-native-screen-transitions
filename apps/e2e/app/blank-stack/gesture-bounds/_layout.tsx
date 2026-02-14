import { withTiming } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { create } from "zustand";
import { BlankStack } from "@/layouts/blank-stack";

export const useGestureBoundsStore = create<{ boundTag: string }>(() => ({
	boundTag: "",
}));

export default function GestureBoundsLayout() {
	const boundTag = useGestureBoundsStore((s) => s.boundTag);

	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="[id]"
				options={{
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
		</BlankStack>
	);
}
