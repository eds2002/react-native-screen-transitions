import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

/**
 * Apple Maps Style: expandViaScrollView = true
 *
 * When at scroll boundary, BOTH expand and collapse work via ScrollView.
 * This is the Apple Maps-style behavior.
 */
export default function AppleMapsLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="sheet"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					snapPoints: [0.4, 0.7, 1.0],
					initialSnapIndex: 0,
					expandViaScrollView: true,
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
