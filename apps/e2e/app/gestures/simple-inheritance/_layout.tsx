import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

/**
 * Scenario 1: Simple Inheritance
 *
 * Structure:
 *   gestures/simple-inheritance/  <- This layout defines gestureDirection: vertical
 *     index                       <- Entry point
 *     leaf                        <- No gesture config (inherits from parent)
 *
 * Expected:
 *   - On leaf: Swipe ↓ dismisses entire stack (inherited from parent)
 *   - On leaf: Swipe ↑ → ← does nothing
 */
export default function SimpleInheritanceLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="leaf"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					screenStyleInterpolator: ({
						layouts: {
							screen: { height },
						},
						progress,
					}) => {
						"worklet";
						const y = interpolate(progress, [0, 1], [height, 0], "clamp");
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
