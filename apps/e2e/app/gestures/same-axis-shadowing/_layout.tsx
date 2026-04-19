import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

/**
 * Scenario 3: Same Axis Shadowing
 *
 * Structure:
 *   gestures/same-axis-shadowing/  <- This layout defines gestureDirection: vertical
 *     index                        <- Entry point
 *     leaf-a                       <- No gesture (inherits vertical from parent)
 *     leaf-b                       <- gestureDirection: vertical (SHADOWS parent)
 *
 * Expected:
 *   - On leaf-a: Swipe ↓ dismisses ENTIRE stack
 *   - On leaf-b: Swipe ↓ dismisses ONLY leaf-b (shadows parent)
 */
export default function SameAxisShadowingLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="leaf-a"
				options={{
					// gestureEnabled: true,
					// gestureDirection: "vertical",
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
			<BlankStack.Screen
				name="leaf-b"
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
