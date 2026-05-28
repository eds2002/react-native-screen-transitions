import { Platform } from "react-native";
import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";

export const IOS_SLIDE_BORDER_RADIUS = Platform.select({
	ios: 58,
	android: 36,
	default: 36,
});

export function IOSSlide(
	config: Partial<ScreenTransitionConfig> = {},
): ScreenTransitionConfig {
	return {
		gestureEnabled: true,
		gestureDirection: "horizontal",
		screenStyleInterpolator: ({
			progress,
			layouts: {
				screen: { width },
			},
      focused,
      active,
		}) => {
			"worklet";
			const translateX = interpolate(
				progress,
				[0, 1, 2],
				[width, 0, -width * 0.3],
			);
      return {
        backdrop: focused ? {
          backgroundColor: "#00000025",
          opacity: progress,
        } : undefined,
				content: {
					style: {
            transform: [{ translateX }],
            overflow: "hidden",
            borderCurve: "continuous",
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
