import { interpolate, interpolateColor } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/components/layouts/blank-stack";
import { Tray } from "@/components/tray";

export default function Layout() {
	return (
		<BlankStack>
			<BlankStack.Screen
				name="index"
				options={{
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<BlankStack.Screen
				name="b"
				options={{
					screenStyleInterpolator: (props) => {
						"worklet";

						console.log(
							"animating screen:",
							props.current.route.key,
							"stackProgress:",
							props.stackProgress,
						);
						const trayStyles = Tray.interpolator();
						return {
							contentStyle: {
								transform: [
									{
										translateY: interpolate(
											props.stackProgress,
											[2, 3],
											[0, -0],
											"clamp",
										),
									},
								],
								backgroundColor: interpolateColor(
									props.stackProgress,
									[2, 3],
									["#FF000000", "#FF000080"],
								),
							},
							...trayStyles(props),
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<BlankStack.Screen
				name="c"
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
	);
}
