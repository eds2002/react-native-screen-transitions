import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Transition from "react-native-screen-transitions";

export default function RootLayout() {
	return (
		<GestureHandlerRootView>
			<Stack screenOptions={{}}>
				<Stack.Screen
					name="index"
					options={{
						headerShown: false,
						contentStyle: {
							backgroundColor: "white",
						},
					}}
					listeners={Transition.createConfig}
				/>
				<Stack.Screen
					name="a"
					options={Transition.defaultScreenOptions()}
					listeners={(l) =>
						Transition.createConfig({
							...l,
							...Transition.presets.SlideFromTop(),
						})
					}
				/>
				<Stack.Screen
					name="b"
					options={Transition.defaultScreenOptions()}
					listeners={(l) =>
						Transition.createConfig({
							...l,
							...Transition.presets.ZoomIn(),
						})
					}
				/>
				<Stack.Screen
					name="c"
					options={Transition.defaultScreenOptions()}
					listeners={(l) =>
						Transition.createConfig({
							...l,
							...Transition.presets.SlideFromBottom(),
						})
					}
				/>
				<Stack.Screen
					name="d"
					options={Transition.defaultScreenOptions()}
					listeners={(l) =>
						Transition.createConfig({
							...l,
							...Transition.presets.DraggableCard(),
						})
					}
				/>
				<Stack.Screen
					name="e"
					options={Transition.defaultScreenOptions()}
					listeners={(l) =>
						Transition.createConfig({
							...l,
							...Transition.presets.ElasticCard(),
						})
					}
				/>
				<Stack.Screen
					name="group-a"
					options={Transition.defaultScreenOptions()}
					listeners={(l) =>
						Transition.createConfig({
							...l,
							...Transition.presets.DraggableCard(),
						})
					}
				/>
				<Stack.Screen
					name="custom"
					options={Transition.defaultScreenOptions()}
					listeners={Transition.createConfig}
				/>
				<Stack.Screen
					name="nested"
					options={Transition.defaultScreenOptions()}
					listeners={(l) =>
						Transition.createConfig({
							...l,
							...Transition.presets.SlideFromTop(),
						})
					}
				/>

				{/* PALETTE PROFILE */}
				<Stack.Screen
					name="mocks/palette-profile"
					options={Transition.defaultScreenOptions()}
					listeners={(l) =>
						Transition.createConfig({
							...l,
							...Transition.presets.DraggableCard(),
						})
					}
				/>
			</Stack>
		</GestureHandlerRootView>
	);
}
