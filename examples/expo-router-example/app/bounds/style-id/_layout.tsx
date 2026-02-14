import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { create } from "zustand";
import { Stack } from "@/layouts/stack";

export const useStyleIdStore = create<{ boundTag: string }>(() => ({
	boundTag: "",
}));

export default function StyleIdLayout() {
	const boundTag = useStyleIdStore((s) => s.boundTag);

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
						next,
					}) => {
						"worklet";

						const x = interpolate(
							focused
								? current.gesture.normalizedX
								: (next?.gesture.normalizedX ?? 0),
							[-1, 1],
							[-screen.width * 0.5, screen.width * 0.5],
							"clamp",
						);
						const y = interpolate(
							focused
								? current.gesture.normalizedY
								: (next?.gesture.normalizedY ?? 0),
							[-1, 1],
							[-screen.height * 0.5, screen.height * 0.5],
							"clamp",
						);

						if (focused) {
							const focusedBoundStyles = bounds({
								id: boundTag,
								method: "content",
								anchor: "top",
								scaleMode: "uniform",
							});

							const focusMaskStyles = bounds({
								id: boundTag,
								space: "absolute",
								target: "fullscreen",
								method: "size",
							});

							return {
								overlayStyle: {
									backgroundColor: "black",
									opacity: interpolate(progress, [0, 1], [0, 0.75]),
								},
								contentStyle: {
									transform: [{ translateX: x }, { translateY: y }],
								},
								"container-view": focusedBoundStyles,
								"masked-view": {
									...focusMaskStyles,
									borderRadius: interpolate(progress, [0, 1], [24, 24]),
								},
							};
						}

						const unfocusedBound = bounds({
							id: boundTag,
							gestures: {
								x,
								y,
							},
						});

						return {
							contentStyle: {
								transform: [
									{
										scale: interpolate(progress, [1, 2], [1, 0.9]),
									},
								],
							},
							[boundTag]: unfocusedBound,
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
