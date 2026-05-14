import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";

const DEFAULT_SPEC = {
	open: Transition.Specs.DefaultSpec,
	close: Transition.Specs.DefaultSpec,
};

type TransitionOptions = Partial<ScreenTransitionConfig>;

export function verticalSlideOptions(
	options: TransitionOptions = {},
): ScreenTransitionConfig {
	return {
		gestureEnabled: true,
		gestureDirection: "vertical",
		...verticalSlidePresentationOptions(),
		...options,
	};
}

export function verticalInvertedSlideOptions(
	options: TransitionOptions = {},
): ScreenTransitionConfig {
	return {
		gestureEnabled: true,
		gestureDirection: "vertical-inverted",
		...verticalInvertedSlidePresentationOptions(),
		...options,
	};
}

export function verticalSlidePresentationOptions(
	options: TransitionOptions = {},
): TransitionOptions {
	return {
		screenStyleInterpolator: ({
			layouts: {
				screen: { height },
			},
			progress,
		}) => {
			"worklet";
			const y = interpolate(progress, [0, 1], [height, 0], "clamp");
			return {
				content: {
					style: {
						transform: [{ translateY: y }],
					},
				},
			};
		},
		transitionSpec: DEFAULT_SPEC,
		...options,
	};
}

export function verticalInvertedSlidePresentationOptions(
	options: TransitionOptions = {},
): TransitionOptions {
	return {
		screenStyleInterpolator: ({
			layouts: {
				screen: { height },
			},
			progress,
		}) => {
			"worklet";
			const y = interpolate(progress, [0, 1], [-height, 0], "clamp");
			return {
				content: {
					style: {
						transform: [{ translateY: y }],
					},
				},
			};
		},
		transitionSpec: DEFAULT_SPEC,
		...options,
	};
}
