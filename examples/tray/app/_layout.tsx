import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { BlankStack } from "@/components/layouts/blank-stack";
import "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Tray } from "@/components/tray";

export default function RootLayout() {
	return (
		<ThemeProvider value={DefaultTheme}>
			<BlankStack>
				<BlankStack.Screen
					name="tray-routes/index"
					options={{
						gestureDirection: "vertical",
						gestureEnabled: true,
						screenStyleInterpolator: (props) => {
							"worklet";

							const trayStyles = Tray.interpolator();
							return trayStyles(props);
						},
						transitionSpec: {
							open: Transition.Specs.DefaultSpec,
							close: Transition.Specs.DefaultSpec,
						},
					}}
				/>
				<BlankStack.Screen
					name="tray-routes/b"
					options={{
						screenStyleInterpolator: (props) => {
							"worklet";

							const trayStyles = Tray.interpolator();
							return trayStyles(props);
						},
						transitionSpec: {
							open: Transition.Specs.DefaultSpec,
							close: Transition.Specs.DefaultSpec,
						},
					}}
				/>
				<BlankStack.Screen
					name="tray-routes/c"
					options={{
						screenStyleInterpolator: (props) => {
							"worklet";
							const trayStyles = Tray.interpolator();
							return trayStyles(props);
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
