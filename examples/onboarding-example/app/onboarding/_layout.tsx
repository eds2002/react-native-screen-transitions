import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/components/layouts/blank-stack";

export default function OnboardingLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="b"
				options={{
					...Transition.Presets.SlideFromBottom(),
				}}
			/>
		</BlankStack>
	);
}
