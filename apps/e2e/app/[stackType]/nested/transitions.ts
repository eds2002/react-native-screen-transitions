import { interpolate } from "react-native-reanimated";
import Transition, {
	type ScreenInterpolationProps,
} from "react-native-screen-transitions";

const transitionSpec = {
	open: Transition.Specs.DefaultSpec,
	close: Transition.Specs.DefaultSpec,
};

export const horizontalScreenOptions = {
	gestureEnabled: true,
	gestureDirection: "horizontal" as const,
	screenStyleInterpolator: ({
		progress,
		layouts: {
			screen: { width },
		},
	}: ScreenInterpolationProps) => {
		"worklet";
		const translateX = interpolate(progress, [0, 1, 2], [width, 0, -width * 0.3]);

		return {
			content: {
				style: {
					transform: [{ translateX }],
				},
			},
		};
	},
	transitionSpec,
};

export const verticalScreenOptions = {
	gestureEnabled: true,
	gestureDirection: "vertical" as const,
	screenStyleInterpolator: ({
		progress,
		layouts: {
			screen: { height },
		},
	}: ScreenInterpolationProps) => {
		"worklet";
		const translateY = interpolate(progress, [0, 1, 2], [height, 0, 0], "clamp");
		const overlayOpacity = interpolate(progress, [0, 1], [0, 0.18], "clamp");

		return {
			content: {
				style: {
					transform: [{ translateY }],
				},
			},
			backdrop: {
				style: {
					backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
				},
			},
		};
	},
	transitionSpec,
};
