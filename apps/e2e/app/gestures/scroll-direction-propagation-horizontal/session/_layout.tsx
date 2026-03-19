import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

/**
 * Session layout — inherits horizontal from the parent route and owns
 * the nested drawer route.
 */
export default function HorizontalSessionLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="drawer"
				options={{
					gestureEnabled: true,
					gestureDirection: "horizontal-inverted",
					screenStyleInterpolator: ({
						layouts: {
							screen: { width },
						},
						progress,
					}) => {
						"worklet";
						const x = interpolate(progress, [0, 1], [-width, 0], "clamp");
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
