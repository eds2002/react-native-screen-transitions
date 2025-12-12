import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/components/layouts/blank-stack";
import { Tray } from "@/components/tray";

export default function TrayRoutesLayout() {
	const navigation = useNavigation();

	useEffect(() => {
		navigation.getParent()?.getParent()?.setOptions({ gestureEnabled: false });
	}, [navigation]);
	return (
		<Tray.View detached={false} snapPoint="100%" backgroundColor="#FFF">
			<BlankStack>
				<BlankStack.Screen name="index" />
				<BlankStack.Screen
					name="b"
					options={{
						screenStyleInterpolator: (props) => {
							"worklet";

							const x = interpolate(
								props.progress,
								[0, 1, 2],
								[props.layouts.screen.width, 0, -props.layouts.screen.width],
							);
							return {
								contentStyle: {
									transform: [{ translateX: x }],
								},
							};
						},
						transitionSpec: {
							open: Transition.Specs.DefaultSpec,
							close: Transition.Specs.DefaultSpec,
						},
					}}
				/>
			</BlankStack>
		</Tray.View>
	);
}
