import { Stack } from "@/layout/stack";
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";

export default function Layout() {
	return (
		<Transition.View>
			<Stack>
				<Stack.Screen
					name="b"
					options={{
						...Transition.presets.SlideFromTop(),
					}}
				/>
				<Stack.Screen
					name="two"
					options={{
						screenStyleInterpolator: ({
							current,
							next,
							layouts: {
								screen: { width },
							},
						}) => {
							"worklet";

							const progress =
								current.progress.value + (next?.progress.value ?? 0);

							const x = interpolate(progress, [0, 1, 2], [width, 0, -width]);
							return {
								contentStyle: {
									transform: [{ translateX: x }],
								},
							};
						},
						transitionSpec: {
							close: Transition.specs.DefaultSpec,
							open: Transition.specs.DefaultSpec,
						},
					}}
				/>
			</Stack>
		</Transition.View>
	);
}
