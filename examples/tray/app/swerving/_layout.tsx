import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/components/layouts/blank-stack";
import { Tray } from "@/components/tray";

export default function TrayRoutesLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="nested"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
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
