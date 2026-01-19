import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

/**
 * Scenario 4: Deep Nesting (3 Levels)
 *
 * Structure:
 *   gestures/deep-nesting/  <- Level 1: vertical
 *     index                 <- Entry point
 *     deeper/               <- Level 2: horizontal (nested stack)
 *       index               <- Entry point for level 2
 *       leaf                <- Level 3: vertical (shadows level 1)
 *
 * This demonstrates inheritance across multiple levels and shadowing.
 */
export default function DeepNestingLayout() {
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
