import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

/**
 * Scenario 9: Deep Nesting with Snap Points
 *
 * Structure:
 *   gestures/snap-deep-nesting/  <- gestureDirection: vertical (L1)
 *     index                       <- Entry point
 *     deeper/                     <- gestureDirection: horizontal (L2)
 *       index
 *       sheet                     <- snapPoints + gestureDirection: vertical (L3)
 *
 * On sheet:
 *   - ↓ collapses/dismisses sheet (sheet owns, shadows L1)
 *   - ↑ expands sheet (sheet owns)
 *   - → dismisses deeper stack (inherited from L2)
 *   - ← nothing
 */
export default function SnapDeepNestingLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="deeper"
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
							contentStyle: {
								transform: [{ translateX: x }],
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
