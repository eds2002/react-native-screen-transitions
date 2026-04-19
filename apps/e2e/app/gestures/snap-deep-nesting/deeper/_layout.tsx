import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

/**
 * Level 2: Horizontal stack
 * Contains a vertical sheet with snap points (L3).
 */
export default function DeeperLayout() {
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
