import {
	Extrapolation,
	interpolate,
	interpolateColor,
	type StyleProps,
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

export const SharedInstagram = (
	config: Partial<ScreenTransitionConfig> = {},
): ScreenTransitionConfig => {
	return {
		gestureEnabled: true,
		gestureDirection: ["vertical", "horizontal"],
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

			const x = interpolate(
				focused
					? current.gesture.normalizedX
					: (next?.gesture.normalizedX ?? 0),
				[-1, 1],
				[-screen.width * 0.9, screen.width * 0.9],
				"clamp",
			);

			const y = interpolate(
				focused
					? current.gesture.normalizedY
					: (next?.gesture.normalizedY ?? 0),
				[-1, 1],
				[-screen.height * 0.9, screen.height * 0.9],
				"clamp",
			);

			const normX = focused
				? current.gesture.normalizedX
				: (next?.gesture.normalizedX ?? 0);
			const normY = focused
				? current.gesture.normalizedY
				: (next?.gesture.normalizedY ?? 0);

			const horizontalScale = interpolate(normX, [0, 1], [1, 0.75], "clamp");
			const verticalScale = interpolate(normY, [0, 1], [1, 0.75], "clamp");

			if (focused) {
				const boundMetrics = bounds(activeBoundId)
					.content()
					.contentFill()
					.build();

				const masked = bounds(activeBoundId)
					.absolute()
					.toFullscreen()
					.size()
					.build();

				return {
					overlayStyle: {
						backgroundColor: "black",
						opacity: interpolate(progress, [0, 1], [0, 0.5]),
					},
					contentStyle: {
						transform: [
							{ translateX: x },
							{ translateY: y },
							{ scale: horizontalScale },
							{ scale: verticalScale },
						],
					},
					"root-container-view": boundMetrics,
					"root-masked-view": {
						...masked,
						borderRadius: interpolate(progress, [0, 1], [0, 24]),
					},
				};
			}

			const boundMetrics = bounds()
				.gestures({
					x,
					y,
				})
				.transform()
				.build();

			// Combine the bounds transforms with your scaling transforms
			const combinedTransforms = [
				...(boundMetrics.transform ?? []),
				{ scale: horizontalScale },
				{ scale: verticalScale },
			] as any;

			return {
				contentStyle: {
					pointerEvents: current.gesture.isDismissing ? "none" : "auto",
				},
				[activeBoundId]: {
					...boundMetrics,
					transform: combinedTransforms, // Use the combined transforms
				},
			};
		},
		transitionSpec: {
			open: {
				mass: 1,
				stiffness: 280,
				damping: 30,
			},
			close: {
				mass: 1,
				stiffness: 600,
				damping: 60,
			},
		},
		...config,
	};
};

export const AppleMusic = (
	config: Partial<ScreenTransitionConfig> = {},
): ScreenTransitionConfig => {
	return {
		enableTransitions: true,
		gestureEnabled: true,
		gestureDirection: ["vertical", "horizontal"],
		gestureDrivesProgress: false,
		screenStyleInterpolator: ({
			bounds,
			activeBoundId,
			focused,
			progress,
			layouts: { screen },
			current,
			next,
		}) => {
			"worklet";

			const normX = focused
				? current.gesture.normalizedX
				: (next?.gesture.normalizedX ?? 0);
			const normY = focused
				? current.gesture.normalizedY
				: (next?.gesture.normalizedY ?? 0);

			const horizontalX = interpolate(normX, [0, 1], [0, screen.width * 0.8]);
			const verticalY = interpolate(normY, [0, 1], [0, screen.height * 0.8]);

			const horizontalScale = interpolate(normX, [0, 1], [1, 0.5], "clamp");
			const opacity = interpolate(
				progress,
				[0, 0.25, 1, 1.5, 2],
				[0, 1, 1, 1, 0],
				"clamp",
			);
			const verticalScale = interpolate(normY, [0, 1], [1, 0.5], "clamp");

			if (focused) {
				const boundMetrics = bounds({
					method: "content",
					anchor: "top",
					scaleMode: "uniform",
				});

				const masked = bounds({
					space: "absolute",
					method: "size",
					target: "fullscreen",
				});

				return {
					contentStyle: {
						transform: [
							{ scale: horizontalScale },
							{ scale: verticalScale },
							{ translateX: horizontalX },
							{ translateY: verticalY },
						],
						opacity,
						shadowColor: "black",
						shadowOffset: { width: 25, height: 25 },
						shadowOpacity: 0.25,
						shadowRadius: 50,
						elevation: 10,
					},
					"root-container-view": boundMetrics,
					"root-masked-view": {
						...masked,
						borderRadius: interpolate(progress, [0, 1], [0, 24]),
					},
				};
			}

			const boundMetrics = bounds({
				method: "transform",
				scaleMode: "none",
				gestures: {
					x: horizontalX,
					y: verticalY,
				},
			});

			// Combine the bounds transforms with your scaling transforms
			const scale = interpolate(progress, [1, 2], [1, 0.95], "clamp");
			const combinedTransforms = [
				{ scale: horizontalScale },
				{ scale: verticalScale },
				...(boundMetrics.transform ?? []),
			] as StyleProps["transform"];

			return {
				[activeBoundId]: {
					...boundMetrics,
					transform: combinedTransforms,
					opacity,
				},
				contentStyle: {
					transform: [{ scale }],
				},
			};
		},
		transitionSpec: {
			open: {
				mass: 1,
				stiffness: 250,
				damping: 30,
			},
			close: {
				mass: 1,
				stiffness: 150,
				damping: 18,
			},
		},
		...config,
	};
};
