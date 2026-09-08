import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

export default function ReplaceBackLayout() {
	return (
		<BlankStack
			screenOptions={{
				gestureEnabled: true,
				gestureDirection: "horizontal",
				screenStyleInterpolator: ({ progress, layouts }) => {
					"worklet";
					return {
						content: {
							transform: [
								{
									translateX: interpolate(
										progress,
										[0, 1, 2],
										[layouts.screen.width, 0, -layouts.screen.width * 0.3],
									),
								},
							],
						},
					};
				},
				transitionSpec: {
					open: Transition.Specs.DefaultSpec,
					close: Transition.Specs.DefaultSpec,
				},
			}}
		>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen name="b" />
			<BlankStack.Screen name="c" />
		</BlankStack>
	);
}
