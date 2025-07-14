import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { NestedOne } from "./NestedOne";
import { NestedTwo } from "./NestedTwo";
import { SecondNestedNavigator } from "./second-nested/SecondNestedNavigator";

const Stack = createNativeStackNavigator();

export function NestedNavigator() {
	return (
		<Transition.View>
			<Stack.Navigator>
				<Stack.Screen
					name="NestedOne"
					component={NestedOne}
					options={{ headerShown: false }}
					listeners={Transition.createConfig}
				/>
				<Stack.Screen
					name="NestedTwo"
					component={NestedTwo}
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
					name="SecondNested"
					component={SecondNestedNavigator}
					options={Transition.defaultScreenOptions()}
					listeners={(l) =>
						Transition.createConfig({
							...l,
							...Transition.presets.SlideFromTop(),
						})
					}
				/>
			</Stack.Navigator>
		</Transition.View>
	);
}
