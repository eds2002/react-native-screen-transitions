import {
	Extrapolation,
	interpolate,
	interpolateColor,
} from "react-native-reanimated";
import type { ScreenTransitionConfig } from "../types/navigator";
import { DefaultSpec } from "./specs";

export const SlideFromTop = (
	config: Partial<ScreenTransitionConfig> = {},
): ScreenTransitionConfig => {
	return {
		enableTransitions: true,
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

			const progress = current.progress + (next?.progress ?? 0);

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
	config: Partial<ScreenTransitionConfig> = {},
): ScreenTransitionConfig => {
	return {
		enableTransitions: true,
		gestureEnabled: false,
		screenStyleInterpolator: ({ current, next }) => {
			"worklet";

			const progress = current.progress + (next?.progress ?? 0);

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
	config: Partial<ScreenTransitionConfig> = {},
): ScreenTransitionConfig => {
	return {
		enableTransitions: true,
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

			const progress = current.progress + (next?.progress ?? 0);

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
	config: Partial<ScreenTransitionConfig> = {},
): ScreenTransitionConfig => {
	return {
		enableTransitions: true,
		gestureEnabled: true,
		gestureDirection: ["horizontal", "vertical"],
		screenStyleInterpolator: ({ current, progress, layouts: { screen } }) => {
			"worklet";

			/** Combined */
			const scale = interpolate(progress, [0, 1, 2], [0, 1, 0.75]);

			/** Vertical */
			const translateY = interpolate(
				current.gesture.normalizedY,
				[-1, 1],
				[-screen.height * 0.5, screen.height * 0.5],
				"clamp",
			);

			/** Horizontal */
			const translateX = interpolate(
				current.gesture.normalizedX,
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
	config: Partial<ScreenTransitionConfig> & {
		elasticFactor?: number;
	} = { elasticFactor: 0.5 },
): ScreenTransitionConfig => {
	return {
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

			/**
			 * Applies to current screen
			 */
			const maxElasticityX = screen.width * (config.elasticFactor ?? 0.5);
			const maxElasticityY = screen.height * (config.elasticFactor ?? 0.5);
			const translateX = interpolate(
				current.gesture.normalizedX,
				[-1, 0, 1],
				[-maxElasticityX, 0, maxElasticityX],
				"clamp",
			);

			const translateY = interpolate(
				current.gesture.normalizedY,
				[-1, 0, 1],
				[-maxElasticityY, 0, maxElasticityY],
				"clamp",
			);

			/**
			 * Applies to unfocused screen ( previous screen )
			 */
			const overlayColor = interpolateColor(
				progress,
				[0, 1],
				["rgba(0,0,0,0)", "rgba(0,0,0,0.5)"],
			);

			return {
				contentStyle: {
					transform: [{ scale }, { translateX }, { translateY }],
				},
				overlayStyle: {
					backgroundColor: !next ? overlayColor : "rgba(0,0,0,0)",
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

export const SharedMaskedView = (
	config: Partial<ScreenTransitionConfig> = {},
): ScreenTransitionConfig => {
	return {
		gestureEnabled: true,
		gestureDirection: ["vertical"],
		enableTransitions: true,
		gestureDrivesProgress: false,
		screenStyleInterpolator: ({
			current,
			layouts: { screen },
			bounds,
			progress,
			focused,
			activeBoundId,
			next,
		}) => {
			"worklet";
			if (focused) {
				const prev = bounds(activeBoundId).content().contentFill().build();
				const masked = bounds(activeBoundId)
					.absolute()
					.toFullscreen()
					.size()
					.build();

				const x = interpolate(
					current.gesture.normalizedY,
					[-1, 1],
					[-screen.height, screen.height],
					"clamp",
				);

				const y = interpolate(
					current.gesture.normalizedX,
					[-1, 1],
					[-screen.width, screen.width],
					"clamp",
				);

				return {
					overlayStyle: {
						backgroundColor: "black",
						opacity: interpolate(progress, [0, 1], [0, 0.5]),
					},
					contentStyle: {
						transform: [{ translateY: x }, { translateX: y }],
					},
					"root-container-view": prev,
					"root-masked-view": {
						...masked,
						borderRadius: interpolate(progress, [0, 1], [0, 24]),
					},
				};
			}

			const translateY = interpolate(
				next?.gesture.normalizedY ?? 0,
				[-1, 1],
				[-screen.height, screen.height],
				"clamp",
			);

			/** Horizontal */
			const translateX = interpolate(
				next?.gesture.normalizedX ?? 0,
				[-1, 1],
				[-screen.width, screen.width],
				"clamp",
			);

			const unfocusedBound = bounds()
				.gestures({
					x: translateX,
					y: translateY,
				})
				.transform()
				.build();

			return {
				contentStyle: {
					transform: [
						{
							scale: interpolate(progress, [1, 2], [1, 0.9]),
						},
					],
				},
				[activeBoundId]: unfocusedBound,
			};
		},
		transitionSpec: {
			open: {
				mass: 1,
				stiffness: 200,
				damping: 21,
			},
			close: {
				mass: 1,
				stiffness: 200,
				damping: 21,
			},
		},
		...config,
	};
};
