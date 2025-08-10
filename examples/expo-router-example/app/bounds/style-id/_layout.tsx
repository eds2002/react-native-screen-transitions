import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function StyleIdLayout() {
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
						activeBoundId,
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
							/**
							 * Rather than animating the bound itself, we animate the entire screen.
							 * `bounds(activeBoundId).content()` provides the correct styles for animating `contentStyle` instead of the bound.
							 */
							const focusedBoundStyles = bounds(activeBoundId)
								.content()
								.build();

							/**
							 * A little tiny detail is the mask effect, here's why we're using the following modifiers:
							 *
							 * .absolute() - The mask is not constrained by the parent and has access to the entire screen.
							 *
							 * .size() - The mask has no set width / height, using a transform animation wouldn't make much sense here + by using size, we can animate the border radius as well.
							 *
							 * .toFullscreen() - We're using styleId to animate the mask, styleId's are not stored in the bounds store.
							 */
							const focusMaskStyles = bounds(activeBoundId)
								.absolute()
								.toFullscreen()
								.size()
								.build();

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

						/**
						 * The bounds helper by default will aniamte the transform properties, however it does not take account for the gesture.
						 *
						 * The reason is because gestures can be modified to adjust for certain looks. In that case, you would want to pass the gesture params to the gestures modifier.
						 *
						 * This syncs the gestures from the next screen onto this screen, giving us that shared look we're chasing.
						 */
						const unfocusedBound = bounds()
							.gestures({
								x,
								y,
							})
							.build();

						return {
							contentStyle: {
								transform: [
									{
										scale: interpolate(progress, [1, 2], [1, 0.9]),
									},
								],
							},
							[activeBoundId]: unfocusedBound,
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
