import { Stack } from "expo-router";
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";

export default function Layout() {
	return (
		<Transition.View>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="one" listeners={Transition.createConfig} />
				<Stack.Screen
					name="two"
					options={Transition.defaultScreenOptions()}
					listeners={(l) =>
						Transition.createConfig({
							...l,
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
						})
					}
				/>
				<Stack.Screen
					name="second-nested"
					options={Transition.defaultScreenOptions()}
					listeners={(l) =>
						Transition.createConfig({
							...l,
							...Transition.presets.SlideFromTop(),
						})
					}
				/>
			</Stack>
		</Transition.View>
	);
}
