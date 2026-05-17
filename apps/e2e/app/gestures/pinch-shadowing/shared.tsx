import { interpolate } from "react-native-reanimated";
import Transition, {
	type ScreenTransitionConfig,
} from "react-native-screen-transitions";

const DEFAULT_SPEC = {
	open: Transition.Specs.DefaultSpec,
	close: Transition.Specs.DefaultSpec,
};

export const PINCH_PROBE_OPTIONS: ScreenTransitionConfig = {
	gestureEnabled: true,
	gestureDirection: ["pinch-in", "pinch-out"],
	gestureSensitivity: 0.75,
	screenStyleInterpolator: ({ progress }) => {
		"worklet";

		const restingScale = interpolate(
			progress,
			[0, 1, 2],
			[0.5, 1, 1.5],
			"clamp",
		);

		const activeOpacity = interpolate(
			progress,
			[0, 1, 2],
			[0, 1, 0.9],
			"clamp",
		);

		return {
			content: {
				style: {
					opacity: activeOpacity,
					transform: [{ scale: restingScale }],
				},
			},
		};
	},
	transitionSpec: DEFAULT_SPEC,
};

export const VERTICAL_PROBE_OPTIONS: ScreenTransitionConfig = {
	gestureEnabled: true,
	gestureDirection: "vertical",
	screenStyleInterpolator: ({
		progress,
		layouts: {
			screen: { height },
		},
	}) => {
		"worklet";
		const translateY = interpolate(progress, [0, 1], [height, 0], "clamp");

		return {
			content: {
				style: {
					transform: [{ translateY }],
				},
			},
		};
	},
	transitionSpec: DEFAULT_SPEC,
};
