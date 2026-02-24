import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

/**
 * Scenario 8: Snap Points + Different Axis Inheritance
 *
 * Structure:
 *   gestures/snap-different-axis/  <- gestureDirection: vertical
 *     index                         <- Entry point
 *     drawer                        <- snapPoints + gestureDirection: horizontal (drawer)
 *
 * The horizontal drawer claims horizontal and horizontal-inverted.
 * But vertical is NOT claimed by the drawer, so it inherits from parent.
 *
 * Expected on drawer:
 *   - → collapse/dismiss drawer (drawer owns horizontal)
 *   - ← expand drawer (drawer owns horizontal-inverted)
 *   - ↓ dismisses ENTIRE stack (inherited from parent vertical)
 *   - ↑ does nothing
 */
export default function SnapDifferentAxisLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="drawer"
				options={{
					gestureEnabled: true,
					gestureDirection: "horizontal",
					snapPoints: [0.5, 0.8],
					initialSnapIndex: 0,
					screenStyleInterpolator: ({
						layouts: {
							screen: { width },
						},
						progress,
					}) => {
						"worklet";
						const x = interpolate(progress, [0, 1], [width, 0], "clamp");
						const scale = interpolate(progress, [1.5, 2], [1, 0.95], "clamp");
						return {
							content: {
								style: {
									transform: [{ translateX: x }, { scale }],
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
