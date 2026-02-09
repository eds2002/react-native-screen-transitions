import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { create } from "zustand";
import { BlankStack } from "@/layouts/blank-stack";

export const useActiveBoundsStore = create<{ boundTag: string }>(() => ({
	boundTag: "",
}));

export default function ActiveBoundsLayout() {
	const boundTag = useActiveBoundsStore((s) => s.boundTag);

	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="[id]"
				options={{
					gestureEnabled: true,
					gestureDirection: ["bidirectional"],
					gestureDrivesProgress: false,
					screenStyleInterpolator: ({ bounds, progress, focused }) => {
						"worklet";

						if (focused) {
							const focusedBoundStyles = bounds({
								id: boundTag,
							});

							return {
								[boundTag]: focusedBoundStyles,
							};
						}

						const scale = interpolate(progress, [1, 2], [1, 0.95]);
						return {
							contentStyle: {
								transform: [{ scale }],
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
