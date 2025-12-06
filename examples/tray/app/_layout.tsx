import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/components/layouts/blank-stack";

export default function RootLayout() {
	return (
		<ThemeProvider value={DefaultTheme}>
			<BlankStack>
				<BlankStack.Screen
					name="linear"
					options={{
						gestureDirection: "vertical",
						gestureEnabled: true,
						screenStyleInterpolator: (props) => {
							"worklet";
							if (props.focused) {
								const y = interpolate(
									props.progress,
									[0, 1],
									[props.layouts.screen.height, 0],
								);
								const overlayOpacity = interpolate(
									props.progress,
									[0, 1],
									[0, 1],
								);
								return {
									contentStyle: {
										transform: [{ translateY: y }],
									},
									overlayStyle: {
										opacity: overlayOpacity,
										backgroundColor: "rgba(0, 0, 0, 0.5)",
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
				<BlankStack.Screen
					name="swerving"
					options={{
						gestureDirection: "vertical",
						gestureEnabled: true,
						screenStyleInterpolator: (props) => {
							"worklet";
							if (props.focused) {
								const y = interpolate(
									props.progress,
									[0, 1],
									[props.layouts.screen.height, 0],
								);
								const overlayOpacity = interpolate(
									props.progress,
									[0, 1],
									[0, 1],
								);
								return {
									contentStyle: {
										transform: [{ translateY: y }],
									},
									overlayStyle: {
										opacity: overlayOpacity,
										backgroundColor: "rgba(0, 0, 0, 0.5)",
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
