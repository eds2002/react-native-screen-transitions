import { useGlobalSearchParams } from "expo-router";
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function StyleIdLayout() {
	const { id } = useGlobalSearchParams<{ id: string }>();

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

						const ID = id; // The sharedBoundTag from params

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
								id: ID,
								method: "content",
								anchor: "top",
								scaleMode: "uniform",
							});

							const focusMaskStyles = bounds({
								id: ID,
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
							id: ID,
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
							[ID]: unfocusedBound,
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
