import { interpolate } from "react-native-reanimated";
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
							screen: { width, height },
						},
					}) => {
						"worklet";

						const y = interpolate(progress, [0, 1, 2], [height, 0, -height]);
						const scale = interpolate(progress, [0, 1, 2], [0.01, 1, 0.01]);

						return {
							contentStyle: {
								transform: [{ translateY: y }, { scale }],
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
