import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/components/layouts/blank-stack";
import "react-native-reanimated";

export default function RootLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen
				name="onboarding"
				options={{
					...Transition.Presets.SlideFromBottom(),
				}}
			/>
		</BlankStack>
	);
}
