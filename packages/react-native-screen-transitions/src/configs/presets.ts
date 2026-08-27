import {
	Extrapolation,
	interpolate,
	interpolateColor,
} from "react-native-reanimated";
import type { ScreenTransitionConfig } from "../types/screen.types";
import { DefaultSpec } from "./specs";

export const SlideFromTop = (
	config: Partial<ScreenTransitionConfig> = {},
): ScreenTransitionConfig => {
	return {
		//@ts-expect-error - Should not lead to any issues
		enableTransitions: true,
		gestureEnabled: true,
		gestureDirection: "vertical-inverted",
		screenStyleInterpolator: ({
			progress,
			layouts: {
				screen: { height },
			},
		}) => {
			"worklet";

			const y = interpolate(progress, [0, 1, 2], [-height, 0, height]);

			return {
				content: {
					style: {
						transform: [{ translateY: y }],
					},
				},
			};
		},
		transitionSpec: {
			open: DefaultSpec,
			close: DefaultSpec,
		},

		...config,
	};
};

export const ZoomIn = (
	config: Partial<ScreenTransitionConfig> = {},
): ScreenTransitionConfig => {
	return {
		//@ts-expect-error - Should not lead to any issues
		enableTransitions: true,
		gestureEnabled: false,
		screenStyleInterpolator: ({ progress }) => {
			"worklet";

			const scale = interpolate(
				progress,
				[0, 1, 2],
				[0.5, 1, 0.5],
				Extrapolation.CLAMP,
			);

			const opacity = interpolate(
				progress,
				[0, 1, 2],
				[0, 1, 0],
				Extrapolation.CLAMP,
			);

			return {
				content: {
					style: {
						transform: [{ scale }],
						opacity,
					},
				},
			};
		},
		transitionSpec: {
			open: DefaultSpec,
			close: DefaultSpec,
		},
		...config,
	};
};

export const SlideFromBottom = (
	config: Partial<ScreenTransitionConfig> = {},
): ScreenTransitionConfig => {
	return {
		//@ts-expect-error - Should not lead to any issues
		enableTransitions: true,
		gestureEnabled: true,
		gestureDirection: "vertical",
		screenStyleInterpolator: ({
			layouts: {
				screen: { height },
			},
			progress,
		}) => {
			"worklet";

			const y = interpolate(progress, [0, 1, 2], [height, 0, -height]);

			return {
				content: {
					style: {
						transform: [{ translateY: y }],
					},
				},
			};
		},
		transitionSpec: {
			open: DefaultSpec,
			close: DefaultSpec,
		},
		...config,
	};
};

export const DraggableCard = (
	config: Partial<ScreenTransitionConfig> = {},
): ScreenTransitionConfig => {
	return {
		//@ts-expect-error - Should not lead to any issues
		enableTransitions: true,
		gestureEnabled: true,
		gestureDirection: ["horizontal", "vertical"],
		screenStyleInterpolator: ({ current, progress, layouts: { screen } }) => {
			"worklet";

			/** Combined */
			const scale = interpolate(progress, [0, 1, 2], [0, 1, 0.75]);

			/** Vertical */
			const translateY = interpolate(
				current.gesture.normY,
				[-1, 1],
				[-screen.height * 0.5, screen.height * 0.5],
			);

			/** Horizontal */
			const translateX = interpolate(
				current.gesture.normX,
				[-1, 1],
				[-screen.width * 0.5, screen.width * 0.5],
			);

			return {
				content: {
					style: {
						transform: [{ scale }, { translateY: translateY }, { translateX }],
					},
				},
			};
		},
		transitionSpec: {
			open: { ...DefaultSpec, overshootClamping: false },
			close: { ...DefaultSpec, overshootClamping: false },
		},
		...config,
	};
};

export const ElasticCard = (
	config: Partial<ScreenTransitionConfig> & {
		elasticFactor?: number;
	} = { elasticFactor: 0.5 },
): ScreenTransitionConfig => {
	return {
		//@ts-expect-error - Should not lead to any issues
		enableTransitions: true,
		gestureEnabled: true,
		gestureDirection: "bidirectional",
		screenStyleInterpolator: ({
			current,
			next,
			layouts: { screen },
			progress,
		}) => {
			"worklet";

			/**
			 * Applies to both screens ( previous and incoming)
			 */
			const scale = interpolate(progress, [0, 1, 2], [0, 1, 0.8]);

			// applies to current screen
			const maxElasticityX = screen.width * (config.elasticFactor ?? 0.5);
			const maxElasticityY = screen.height * (config.elasticFactor ?? 0.5);
			const translateX = interpolate(
				current.gesture.normX,
				[-1, 0, 1],
				[-maxElasticityX, 0, maxElasticityX],
				"clamp",
			);

			const translateY = interpolate(
				current.gesture.normY,
				[-1, 0, 1],
				[-maxElasticityY, 0, maxElasticityY],
				"clamp",
			);

			// applies to unfocused screen ( previous screen )
			const overlayColor = interpolateColor(
				progress,
				[0, 1],
				["rgba(0,0,0,0)", "rgba(0,0,0,0.5)"],
			);

			return {
				content: {
					style: {
						transform: [{ scale }, { translateX }, { translateY }],
					},
				},
				backdrop: {
					style: {
						backgroundColor: !next ? overlayColor : "rgba(0,0,0,0)",
					},
				},
			};
		},
		transitionSpec: {
			open: { ...DefaultSpec, overshootClamping: false },
			close: { ...DefaultSpec, overshootClamping: false },
		},
		...config,
	};
};
