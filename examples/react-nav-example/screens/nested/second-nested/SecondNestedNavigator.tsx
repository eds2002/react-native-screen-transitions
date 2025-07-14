import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { SecondNestedOne } from "./SecondNestedOne";
import { SecondNestedTwo } from "./SecondNestedTwo";

const Stack = createNativeStackNavigator();

export function SecondNestedNavigator() {
	return (
		<Transition.View>
			<Stack.Navigator>
				<Stack.Screen
					name="SecondNestedOne"
					component={SecondNestedOne}
					options={{ headerShown: false }}
					listeners={Transition.createConfig}
				/>
				<Stack.Screen
					name="SecondNestedTwo"
					component={SecondNestedTwo}
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
			</Stack.Navigator>
		</Transition.View>
	);
}
