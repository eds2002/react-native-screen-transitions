import { Platform } from "react-native";
import {
	Extrapolation,
	interpolate,
	interpolateColor,
} from "react-native-reanimated";
import {
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
} from "../constants";
import type { ScreenTransitionConfig } from "../types/screen.types";
import { normalizeInterpolatedStyle } from "../utils/normalize-interpolated-style";
import { DefaultSpec } from "./specs";

const platform = Platform.OS;

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
				content: {
					style: {
						transform: [{ scale }, { translateY: translateY }, { translateX }],
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
			open: DefaultSpec,
			close: DefaultSpec,
		},
		...config,
	};
};

export const SharedIGImage = ({
	sharedBoundTag,
	...config
}: Partial<ScreenTransitionConfig> & {
	sharedBoundTag: string;
}): ScreenTransitionConfig => {
	return {
		gestureEnabled: true,
		gestureDirection: ["vertical", "horizontal"],
		enableTransitions: true,
		gestureDrivesProgress: false,
		screenStyleInterpolator: ({
			current,
			layouts: {
				screen: { height, width },
			},
			bounds,
			progress,
			focused,
			active,
		}) => {
			"worklet";

			const normX = active.gesture.normalizedX;
			const normY = active.gesture.normalizedY;

			const dragX = interpolate(
				normX,
				[-1, 0, 1],
				[-width * 0.7, 0, width * 0.7],
				"clamp",
			);
			const dragY = interpolate(
				normY,
				[-1, 0, 1],
				[-height * 0.4, 0, height * 0.4],
				"clamp",
			);
			const dragXScale = interpolate(normX, [0, 1], [1, 0.8]);
			const dragYScale = interpolate(normY, [0, 1], [1, 0.8]);

			const navigationStyles = bounds({
				id: sharedBoundTag,
			}).navigation.zoom({
				scaleMode: "uniform",
			});

			// Extract raw style values from bounds result (legacy format)
			const sourceStyle = navigationStyles[sharedBoundTag] as
				| Record<string, unknown>
				| undefined;
			const containerStyle = navigationStyles[NAVIGATION_CONTAINER_STYLE_ID] as
				| Record<string, unknown>
				| undefined;
			const maskStyle = navigationStyles[NAVIGATION_MASK_STYLE_ID] as
				| Record<string, unknown>
				| undefined;

			// Normalize bounds result to new slot format for spreading
			const normalizedNav = normalizeInterpolatedStyle(
				navigationStyles as Record<string, any>,
			).result;

			if (focused) {
				return {
					...normalizedNav,
					backdrop: {
						style: {
							backgroundColor: "black",
							opacity: interpolate(progress, [0, 1], [0, 0.5]),
						},
					},
					content: {
						style: {
							transform: [
								{ translateX: dragX },
								{ translateY: dragY },
								{ scale: dragXScale },
								{ scale: dragYScale },
							],
						},
					},
					[NAVIGATION_CONTAINER_STYLE_ID]: containerStyle
						? {
								style: {
									...containerStyle,
									transform: [
										...(((containerStyle.transform as any[]) ?? []) as any[]),
										{ translateX: dragX * 0.2 },
										{ translateY: dragY * 0.2 },
									],
								},
							}
						: undefined,
					[NAVIGATION_MASK_STYLE_ID]: maskStyle
						? {
								style: {
									...maskStyle,
									borderRadius: interpolate(progress, [0, 1], [0, 24]),
								},
							}
						: undefined,
				};
			}

			return {
				...normalizedNav,
				content: {
					style: {
						...(normalizedNav.content?.style ?? {}),
						pointerEvents: current.gesture.isDismissing ? "none" : "auto",
					},
				},
				[sharedBoundTag]: {
					style: {
						...(sourceStyle ?? {}),
						transform: [
							{ translateX: dragX || 0 },
							{ translateY: dragY || 0 },
							...(((sourceStyle?.transform as any[]) ?? []) as any[]),
							{ scale: dragXScale },
							{ scale: dragYScale },
						],
					},
				},
			};
		},
		transitionSpec: {
			open: {
				stiffness: 1500,
				damping: 1000,
				mass: 3,
				overshootClamping: true,
				//@ts-expect-error
				restSpeedThreshold: 0.02,
			},
			close: {
				stiffness: 1500,
				damping: 1000,
				mass: 3,
				overshootClamping: true,
				//@ts-expect-error
				restSpeedThreshold: 0.02,
			},
		},
		...config,
	};
};

export const SharedAppleMusic = ({
	sharedBoundTag,
	...config
}: Partial<ScreenTransitionConfig> & {
	sharedBoundTag: string;
}): ScreenTransitionConfig => {
	return {
		enableTransitions: true,
		gestureEnabled: true,
		gestureDirection: ["vertical", "horizontal"],
		gestureDrivesProgress: false,
		screenStyleInterpolator: ({
			bounds,
			focused,
			progress,
			layouts: { screen },
			current,
			active,
		}) => {
			"worklet";

			const normX = active.gesture.normalizedX;
			const normY = active.gesture.normalizedY;
			const initialDirection = active.gesture.direction;

			/**
			 * ===============================
			 * Animations for both bounds
			 * ===============================
			 */
			const xResistance = initialDirection === "horizontal" ? 0.7 : 0.4;
			const yResistance = initialDirection === "vertical" ? 0.7 : 0.4;

			const xScaleOuput = initialDirection === "horizontal" ? [1, 0.5] : [1, 1];
			const yScaleOuput = initialDirection === "vertical" ? [1, 0.5] : [1, 1];

			const dragX = interpolate(
				normX,
				[-1, 0, 1],
				[-screen.width * xResistance, 0, screen.width * xResistance],
				"clamp",
			);
			const dragY = interpolate(
				normY,
				[-1, 0, 1],
				[-screen.height * yResistance, 0, screen.height * yResistance],
				"clamp",
			);
			const dragXScale = interpolate(normX, [0, 1], xScaleOuput);
			const dragYScale = interpolate(normY, [0, 1], yScaleOuput);

			const boundValues = bounds({
				id: sharedBoundTag,
				method: focused ? "content" : "transform",
				anchor: "top",
				scaleMode: "uniform",
				raw: true,
			});

			const opacity = interpolate(
				progress,
				[0, 0.25, 1.25, 2],
				[0, 1, 1, 0],
				"clamp",
			);

			/**
			 * ===============================
			 * Focused specific animations
			 * ===============================
			 */
			if (focused) {
				const maskedValues = bounds({
					id: sharedBoundTag,
					space: "absolute",
					method: "size",
					target: "fullscreen",
					raw: true,
				});

				// Apple Music style drop shadow that increases with drag magnitude
				const dragMagnitude = Math.max(Math.abs(normX), Math.abs(normY));
				const shadowOpacity = interpolate(
					dragMagnitude,
					[0, 1],
					[0, 0.25],
					"clamp",
				);
				const shadowRadius = interpolate(
					dragMagnitude,
					[0, 1],
					[0, 24],
					"clamp",
				);
				const shadowOffsetY = interpolate(
					dragMagnitude,
					[0, 1],
					[0, 20],
					"clamp",
				);
				const elevation = interpolate(dragMagnitude, [0, 1], [0, 24], "clamp");

				const IOSShadowStyle = {
					shadowColor: "#000",
					shadowOpacity,
					shadowRadius,
					shadowOffset: { width: 0, height: shadowOffsetY },
				};

				const AndroidShadowStyle = {
					elevation,
					shadowColor: "#000",
				};

				return {
					content: {
						style: {
							pointerEvents: current.animating ? "none" : "auto",
							transform: [
								{ translateX: dragX || 0 },
								{ translateY: dragY || 0 },
								{ scale: dragXScale },
								{ scale: dragYScale },
							],
							opacity,
							...(platform === "ios" ? IOSShadowStyle : AndroidShadowStyle),
						},
					},
					_ROOT_CONTAINER: {
						style: {
							transform: [
								{ translateX: boundValues.translateX || 0 },
								{ translateY: boundValues.translateY || 0 },
								//@ts-expect-error
								{ scale: boundValues.scale || 1 },
							],
						},
					},
					_ROOT_MASKED: {
						style: {
							width: maskedValues.width,
							height: maskedValues.height,
							transform: [
								{ translateX: maskedValues.translateX || 0 },
								{ translateY: maskedValues.translateY || 0 },
							],
							borderRadius: interpolate(progress, [0, 1], [0, 24]),
						},
					},
				};
			}

			/**
			 * ===============================
			 * Unfocused specific animations
			 * ===============================
			 */

			const scaledBoundTranslateX = (boundValues.translateX || 0) * dragXScale;
			const scaledBoundTranslateY = (boundValues.translateY || 0) * dragYScale;
			const scaledBoundScaleX = (boundValues.scaleX || 1) * dragXScale;
			const scaledBoundScaleY = (boundValues.scaleY || 1) * dragYScale;

			const contentScale = interpolate(progress, [1, 2], [1, 0.9], "clamp");

			return {
				[sharedBoundTag]: {
					style: {
						transform: [
							{ translateX: dragX || 0 },
							{ translateY: dragY || 0 },
							{ translateX: scaledBoundTranslateX },
							{ translateY: scaledBoundTranslateY },
							{ scale: dragXScale },
							{ scale: dragYScale },
							{ scaleX: scaledBoundScaleX },
							{ scaleY: scaledBoundScaleY },
						],
						opacity,
						zIndex: current.animating ? 999 : -1,
						position: "relative",
					},
				},
				content: {
					style: {
						transform: [{ scale: contentScale }],
					},
				},
			};
		},
		transitionSpec: {
			open: {
				stiffness: 1000,
				damping: 500,
				mass: 3,
				overshootClamping: true,
				//@ts-expect-error - Should not lead to any issues
				restSpeedThreshold: 0.02,
			},
			close: {
				stiffness: 600,
				damping: 60,
				mass: 4,
				overshootClamping: false,
				//@ts-expect-error - Should not lead to any issues
				restSpeedThreshold: 0.02,
				restDisplacementThreshold: 0.002,
			},
		},
		...config,
	};
};

export const SharedXImage = ({
	sharedBoundTag,
	...config
}: Partial<ScreenTransitionConfig> & {
	sharedBoundTag: string;
}): ScreenTransitionConfig => {
	return {
		//@ts-expect-error - Should not lead to any issues
		enableTransitions: true,
		gestureEnabled: true,
		gestureDirection: ["vertical", "vertical-inverted"],
		gestureDrivesProgress: false,
		screenStyleInterpolator: ({
			focused,
			bounds,
			current,
			layouts: { screen },
			progress,
		}) => {
			"worklet";

			if (!focused) return {};

			const navigationStyles = bounds({
				id: sharedBoundTag,
			}).navigation.zoom();
			const maskStyle = navigationStyles[NAVIGATION_MASK_STYLE_ID] as
				| Record<string, unknown>
				| undefined;

			// Normalize bounds result to new slot format for spreading
			const normalizedNav = normalizeInterpolatedStyle(
				navigationStyles as Record<string, any>,
			).result;

			const dragY = interpolate(
				current.gesture.normalizedY,
				[-1, 0, 1],
				[-screen.height, 0, screen.height],
			);

			const contentY = interpolate(
				progress,
				[0, 1],
				[dragY >= 0 ? screen.height : -screen.height, 0],
			);

			const overlayClr = interpolateColor(
				current.progress - Math.abs(current.gesture.normalizedY),
				[0, 1],
				["rgba(0,0,0,0)", "rgba(0,0,0,1)"],
			);

			const borderRadius = interpolate(current.progress, [0, 1], [12, 0]);

			return {
				...normalizedNav,
				[NAVIGATION_MASK_STYLE_ID]: maskStyle
					? {
							style: {
								...maskStyle,
								borderRadius,
							},
						}
					: undefined,
				content: {
					style: {
						transform: [{ translateY: contentY }, { translateY: dragY }],
						pointerEvents: current.animating ? "none" : "auto",
					},
				},
				backdrop: {
					style: {
						backgroundColor: overlayClr,
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
