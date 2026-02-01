import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

/**
 * Scroll Direction Propagation Example
 *
 * Structure:
 *   scroll-direction-propagation/  <- gestureDirection: vertical (via parent)
 *     index                         <- Entry point
 *     session                       <- No gesture (inherits vertical from parent)
 *     settings/                     <- gestureDirection: vertical-inverted (slide from top)
 *       index                       <- Transition.ScrollView (coordinates with BOTH owners)
 *
 * This tests the fix where ScrollView ownership is resolved per-direction
 * instead of per-axis. The ScrollView in settings/index must coordinate with:
 *   - The outer stack (vertical) for swipe-down at top boundary
 *   - The settings stack (vertical-inverted) for swipe-up at bottom boundary
 */
export default function ScrollDirectionPropagationLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="session"
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
							contentStyle: {
								transform: [{ translateY: y }],
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
				name="settings"
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
							contentStyle: {
								transform: [{ translateY: y }],
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
