import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

const inheritedBoundsInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	() => {
		"worklet";
		return {};
	};

export default function TransitionScopeDeepLayout() {
	const StackNavigator = BlankStack;

	return (
		<StackNavigator>
			<StackNavigator.Screen
				name="index"
				options={{
					screenStyleInterpolator: inheritedBoundsInterpolator,
					experimental_animateOnInitialMount: true,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
