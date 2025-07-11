import {
	Extrapolation,
	interpolate,
	interpolateColor,
} from "react-native-reanimated";
import type { TransitionConfig } from "../types";
import { DefaultSpec } from "./specs";

export const SlideFromTop = (
	config: Partial<TransitionConfig> = {},
): TransitionConfig => {
	return {
		gestureEnabled: true,
		gestureDirection: "vertical-inverted",
		screenStyleInterpolator: ({
			current,
			next,
			layouts: {
				screen: { height },
			},
		}) => {
			"worklet";

			const progress = current.progress.value + (next?.progress.value ?? 0);

			const y = interpolate(progress, [0, 1, 2], [-height, 0, height]);

			return {
				contentStyle: {
					transform: [{ translateY: y }],
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
	config: Partial<TransitionConfig> = {},
): TransitionConfig => {
	return {
		gestureEnabled: false,
		screenStyleInterpolator: ({ current, next }) => {
			"worklet";

			const progress = current.progress.value + (next?.progress.value ?? 0);

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
				contentStyle: {
					transform: [{ scale }],
					opacity,
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
	config: Partial<TransitionConfig> = {},
): TransitionConfig => {
	return {
		gestureEnabled: true,
		gestureDirection: "vertical",
		screenStyleInterpolator: ({
			current,
			next,
			layouts: {
				screen: { height },
			},
		}) => {
			"worklet";

			const progress = current.progress.value + (next?.progress.value ?? 0);

			const y = interpolate(progress, [0, 1, 2], [height, 0, -height]);

			return {
				contentStyle: {
					transform: [{ translateY: y }],
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
	config: Partial<TransitionConfig> = {},
): TransitionConfig => {
	return {
		gestureEnabled: true,
		gestureDirection: ["horizontal", "vertical"],
		screenStyleInterpolator: ({ current, next, layouts: { screen } }) => {
			"worklet";

			const progress = current.progress.value + (next?.progress.value ?? 0);

			/** Combined */
			const scale = interpolate(progress, [0, 1, 2], [0, 1, 0.75]);

			/** Vertical */
			const translateY = interpolate(
				current.gesture.normalizedY.value,
				[-1, 1],
				[-screen.height * 0.5, screen.height * 0.5],
				"clamp",
			);

			/** Horizontal */
			const translateX = interpolate(
				current.gesture.normalizedX.value,
				[-1, 1],
				[-screen.width * 0.5, screen.width * 0.5],
				"clamp",
			);

			return {
				contentStyle: {
					transform: [{ scale }, { translateY: translateY }, { translateX }],
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

export const ElasticCard = (
	config: Partial<TransitionConfig> & {
		elasticFactor?: number;
	} = { elasticFactor: 0.5 },
): TransitionConfig => {
	return {
		gestureEnabled: true,
		gestureDirection: "bidirectional",
		screenStyleInterpolator: ({ current, next, layouts: { screen } }) => {
			"worklet";

			/**
			 * Applies to both screens ( previous and incoming)
			 */
			const progress = current.progress.value + (next?.progress.value ?? 0);
			const scale = interpolate(progress, [0, 1, 2], [0, 1, 0.8]);

			/**
			 * Applies to current screen
			 */
			const maxElasticityX = screen.width * (config.elasticFactor ?? 0.5);
			const maxElasticityY = screen.height * (config.elasticFactor ?? 0.5);
			const translateX = interpolate(
				current.gesture.normalizedX.value,
				[-1, 0, 1],
				[-maxElasticityX, 0, maxElasticityX],
				"clamp",
			);

			const translateY = interpolate(
				current.gesture.normalizedY.value,
				[-1, 0, 1],
				[-maxElasticityY, 0, maxElasticityY],
				"clamp",
			);

			/**
			 * Applies to unfocused screen ( previous screen )
			 */
			const overlayColor = interpolateColor(
				next?.progress.value || 0,
				[0, 1],
				["rgba(0,0,0,0)", "rgba(0,0,0,0.5)"],
			);

			return {
				contentStyle: {
					transform: [{ scale }, { translateX }, { translateY }],
				},
				overlayStyle: {
					backgroundColor: overlayColor,
				},
			};
		},
		...config,
	};
};
