import { useGlobalSearchParams } from "expo-router";
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function ActiveBoundsLayout() {
	const { id } = useGlobalSearchParams<{ id: string }>();
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
					gestureDirection: ["bidirectional"],
					gestureDrivesProgress: false,
					enableTransitions: true,

					screenStyleInterpolator: ({ bounds, progress, focused }) => {
						"worklet";

						if (focused) {
							/**
							 * We use .relative() here because the bound is constrained by parent components that do not take up the full screen.
							 * This ensures the animation is relative to its parent container, not the entire screen.
							 * .transform() (default) - Animates the transform properties (translate, scale, etc.) of the bound, which is generally more performant than animating width/height.
							 */
							const focusedBoundStyles = bounds({
								id: id,
							});

							return {
								[id]: focusedBoundStyles,
							};
						}

						const scale = interpolate(progress, [1, 2], [1, 0.95]);
						return {
							contentStyle: {
								transform: [
									{
										scale,
									},
								],
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
