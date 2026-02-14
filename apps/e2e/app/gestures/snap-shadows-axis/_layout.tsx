import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

/**
 * Scenario 7: Snap Points Shadow Same Axis
 *
 * Structure:
 *   gestures/snap-shadows-axis/  <- gestureDirection: vertical
 *     index                       <- Entry point
 *     sheet                       <- snapPoints + gestureDirection: vertical
 *
 * Key concept: A snap point sheet claims BOTH directions on its axis.
 * So this sheet claims both vertical (↓) AND vertical-inverted (↑).
 * This means it completely shadows the parent's vertical gesture.
 *
 * Expected on sheet:
 *   - ↓ collapses/dismisses sheet (NOT parent) - sheet owns vertical
 *   - ↑ expands sheet - sheet owns vertical-inverted too
 *   - → ← do nothing
 */
export default function SnapShadowsAxisLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="sheet"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					snapPoints: [0.5, 0.8],
					initialSnapIndex: 0,
					screenStyleInterpolator: ({
						layouts: {
							screen: { height },
						},
						progress,
					}) => {
						"worklet";
						const y = interpolate(progress, [0, 1], [height, 0], "clamp");
						const scale = interpolate(progress, [1.5, 2], [1, 0.95], "clamp");
						return {
							contentStyle: {
								transform: [{ translateY: y }, { scale }],
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
