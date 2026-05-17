import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";

export function IOSSlide(
	config: Partial<ScreenTransitionConfig> = {},
): ScreenTransitionConfig {
	return {
		enableTransitions: true,
		gestureEnabled: true,
		gestureDirection: "horizontal",
		screenStyleInterpolator: ({
			progress,
			layouts: {
				screen: { width },
			},
		}) => {
			"worklet";
			const translateX = interpolate(
				progress,
				[0, 1, 2],
				[width, 0, -width * 0.3],
			);
			return {
				content: {
					style: {
						transform: [{ translateX }],
					},
				},
			};
		},
		transitionSpec: {
			open: Transition.Specs.DefaultSpec,
			close: Transition.Specs.DefaultSpec,
		},
		...config,
	};
}
