import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { BlankStack } from "@/components/layouts/blank-stack";
import "react-native-reanimated";
import { interpolate, interpolateColor } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";

export default function RootLayout() {
	return (
		<ThemeProvider value={DefaultTheme}>
			<BlankStack>
				<BlankStack.Screen
					name="tray-routes"
					options={{
						gestureEnabled: true,
						gestureDirection: "vertical",
						freezeOnBlur: false,
						screenStyleInterpolator: ({ focused, progress, layouts }) => {
							"worklet";

							if (focused) {
								const overlayColor = interpolateColor(
									progress,
									[0, 1],
									["#00000000", "#00000040"],
								);

								const y = interpolate(
									progress,
									[0, 1],
									[layouts.screen.height, 0],
									"clamp",
								);
								return {
									contentStyle: {
										transform: [{ translateY: y }],
									},
									overlayStyle: {
										backgroundColor: overlayColor,
									},
								};
							}
							return {};
						},
						transitionSpec: {
							open: Transition.Specs.DefaultSpec,
							close: Transition.Specs.DefaultSpec,
						},
					}}
				/>
			</BlankStack>

			<StatusBar style="light" />
		</ThemeProvider>
	);
}
