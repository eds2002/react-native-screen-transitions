import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import { DefaultSpec } from "../../../../packages/react-native-screen-transitions/src/shared/configs/specs";

export default function ComponentStackLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen
				name="index"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical-inverted",
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { height, width },
						},
					}) => {
						"worklet";

						const x = interpolate(progress, [0, 1, 2], [width, 0, -width]);

						return {
							contentStyle: {
								transform: [{ translateX: x }],
							},
						};
					},
					transitionSpec: {
						open: DefaultSpec,
						close: DefaultSpec,
					},
				}}
			/>
		</BlankStack>
	);
}
