import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { REVEAL_TRANSFORMED_SOURCE_ID } from "./constants";

export default function RevealTransformedSourceLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="destination"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					navigationMaskEnabled: true,
					screenStyleInterpolator: ({ bounds }) => {
						"worklet";
						return bounds({
							id: REVEAL_TRANSFORMED_SOURCE_ID,
						}).navigation.zoom();
					},
					transitionSpec: Transition.Specs.Zoom,
				}}
			/>
		</StackNavigator>
	);
}
