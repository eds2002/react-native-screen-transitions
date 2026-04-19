import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

/**
 * Visual regression: snap-locked no-bubble behavior.
 *
 * Parent claims vertical. Child sheet also claims vertical via snap points,
 * but has gestureEnabled=false + gestureSnapLocked=true.
 *
 * Expected: child still shadows axis ownership, so same-axis swipes should
 * NOT bubble to parent when child cannot move/dismiss.
 */
export default function SnapLockedNoBubbleLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="sheet"
				options={{
					gestureEnabled: false,
					gestureDirection: "vertical",
					gestureSnapLocked: true,
					snapPoints: [0, 0.55, 1],
					initialSnapIndex: 1,
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
							content: {
								style: {
									transform: [{ translateY: y }, { scale }],
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
