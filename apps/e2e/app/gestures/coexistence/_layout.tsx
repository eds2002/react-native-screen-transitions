import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

/**
 * Scenario 6: Same Axis, Different Directions (Coexistence)
 *
 * Structure:
 *   gestures/coexistence/  <- gestureDirection: vertical-inverted (↑ dismisses)
 *     index                <- Entry point
 *     leaf                 <- gestureDirection: vertical (↓ dismisses)
 *
 * Expected on leaf:
 *   - Swipe ↓ dismisses ONLY leaf (vertical from leaf)
 *   - Swipe ↑ dismisses ENTIRE stack (vertical-inverted from parent)
 *   - No conflict! Both directions coexist.
 */
export default function CoexistenceLayout() {
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
