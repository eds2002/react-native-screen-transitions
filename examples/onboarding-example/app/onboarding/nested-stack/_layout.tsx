import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/components/layouts/blank-stack";

export default function OnboardingLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen
				name="index"
				options={{
					screenStyleInterpolator: ({ activeBoundId, bounds }) => {
						"worklet";

						const boundsConfig = bounds({});
						return {
							[activeBoundId]: boundsConfig,
						};
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
