import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

const modalOptions: ScreenTransitionConfig = {
	gestureEnabled: true,
	gestureTracking: "always",
	gestureDirection: "vertical",
	screenStyleInterpolator: ({
		layouts: {
			screen: { height },
		},
		progress,
		focused,
		active,
		current,
	}) => {
		"worklet";

		const isGestureDisabled = !current.options.gestureEnabled;

		const translateY = focused
			? interpolate(progress, [0, 1], [height, 0], "clamp")
			: 0;

		const gestureSensitivity = isGestureDisabled
			? interpolate(progress, [0, 0.25], [1, 0.1], "clamp")
			: 1;

		const gestureReleaseVelocityScale = isGestureDisabled ? 0 : 1;

		const contentStyle = {
			transform: [{ translateY }],
			maxHeight: focused ? height * 0.9 : undefined,
			marginTop: focused ? "auto" : undefined,
		} as const;

		const backdropStyle = focused
			? {
					backgroundColor: "#00000050",
					opacity: active.progress,
				}
			: undefined;

		return {
			options: {
				gestureSensitivity,
				gestureReleaseVelocityScale,
			},
			content: { style: contentStyle },
			backdrop: { style: backdropStyle },
		};
	},
	transitionSpec: {
		open: Transition.Specs.DefaultSpec,
		close: Transition.Specs.DefaultSpec,
	},
};

export default function ExampleLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen name="modal" options={modalOptions} />
		</BlankStack>
	);
}
