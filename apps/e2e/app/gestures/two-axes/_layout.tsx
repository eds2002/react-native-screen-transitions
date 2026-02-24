import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

/**
 * Scenario 2: Two Axes, No Conflict
 *
 * Structure:
 *   gestures/two-axes/  <- This layout defines gestureDirection: vertical
 *     index             <- Entry point (inherits vertical)
 *     leaf              <- gestureDirection: horizontal
 *
 * Expected on leaf:
 *   - Swipe ↓ dismisses entire stack (vertical from parent)
 *   - Swipe → dismisses only leaf (horizontal from leaf itself)
 *   - No conflict: different axes are independent
 */
export default function TwoAxesLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="leaf"
				options={{
					gestureEnabled: true,
					gestureDirection: "horizontal",
					screenStyleInterpolator: ({
						layouts: {
							screen: { width },
						},
						progress,
					}) => {
						"worklet";
						const x = interpolate(
							progress,
							[0, 1, 2],
							[width, 0, -width * 0.3],
						);
						return {
							content: {
								style: {
									transform: [{ translateX: x }],
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
