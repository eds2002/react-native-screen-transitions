import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

/**
 * Instagram Style: expandViaScrollView = false (default)
 *
 * Expand only works via deadspace (handle/header).
 * Collapse still works via ScrollView at boundary.
 */
export default function InstagramLayout() {
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
					expandViaScrollView: false,
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
