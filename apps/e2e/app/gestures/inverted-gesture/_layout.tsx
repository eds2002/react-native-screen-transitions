import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

/**
 * Scenario 5: Inverted Gesture
 *
 * Structure:
 *   gestures/inverted-gesture/  <- gestureDirection: vertical-inverted
 *     index                      <- Entry point
 *     leaf                       <- No gesture (inherits inverted)
 *
 * Expected on leaf:
 *   - Swipe ↑ dismisses stack (vertical-inverted = drag UP to dismiss)
 *   - Swipe ↓ does nothing (different direction)
 */
export default function InvertedGestureLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="leaf"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical-inverted",
					screenStyleInterpolator: ({
						layouts: {
							screen: { height },
						},
						progress,
					}) => {
						"worklet";
						// Inverted: comes from top, dismiss by dragging up
						const y = interpolate(progress, [0, 1], [-height, 0], "clamp");
						return {
							content: {
								style: {
									transform: [{ translateY: y }],
								},
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
