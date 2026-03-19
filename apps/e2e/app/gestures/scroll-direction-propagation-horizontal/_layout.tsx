import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

/**
 * Horizontal Scroll Direction Propagation Example
 *
 * Structure:
 *   scroll-direction-propagation-horizontal/  <- gestureDirection: horizontal
 *     index                                    <- Entry point
 *     session/                                 <- gestureDirection: horizontal
 *       index                                  <- No gesture (inherits horizontal)
 *       drawer                                 <- gestureDirection: horizontal-inverted
 *                                                horizontal Transition.ScrollView
 *
 * The ScrollView in session/drawer must coordinate with:
 *   - The session screen (horizontal) for swipe-right at left boundary
 *   - The drawer screen (horizontal-inverted) for swipe-left at right boundary
 */
export default function ScrollDirectionPropagationHorizontalLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="session"
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
						const x = interpolate(progress, [0, 1], [width, 0], "clamp");
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
