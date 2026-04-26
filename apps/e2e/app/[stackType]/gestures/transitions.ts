// @ts-nocheck
import { interpolate } from "react-native-reanimated";
import Transition, {
	type ScreenTransitionConfig,
} from "react-native-screen-transitions";
import type { GestureExampleId } from "./shared";

const DEFAULT_SPEC = {
	open: Transition.Specs.DefaultSpec,
	close: Transition.Specs.DefaultSpec,
};

const GESTURE_RESISTANCE = 0.45;

function buildHorizontalOptions(inverted: boolean): ScreenTransitionConfig {
	return {
		gestureEnabled: true,
		gestureDirection: inverted ? "horizontal-inverted" : "horizontal",

		screenStyleInterpolator: ({
			progress,
			layouts: {
				screen: { width },
			},
			active,
		}) => {
			"worklet";
			const enterX = inverted ? -width : width;
			const exitX = inverted ? width * 0.25 : -width * 0.25;
			const translateX = interpolate(
				progress,
				[0, 1, 2],
				[enterX, 0, exitX],
				"clamp",
			);

			return {
				config: {
					gestureSensitivity: interpolate(
						active.gesture.raw.normX,
						[0, 0.25],
						[1, 0.5],
						"clamp",
					),
				},
				content: {
					style: {
						transform: [{ translateX }],
					},
				},
			};
		},
		transitionSpec: DEFAULT_SPEC,
	};
}

function buildVerticalOptions(inverted: boolean) {
	return {
		gestureEnabled: true,
		gestureDirection: inverted ? "vertical-inverted" : "vertical",
		screenStyleInterpolator: ({
			progress,
			layouts: {
				screen: { height },
			},
		}) => {
			"worklet";
			const enterY = inverted ? -height : height;
			const exitY = inverted ? -height * 0.18 : height * 0.18;
			const translateY = interpolate(
				progress,
				[0, 1, 2],
				[enterY, 0, exitY],
				"clamp",
			);

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
}

function buildBidirectionalOptions() {
	return {
		gestureEnabled: true,
		gestureDirection: "bidirectional" as const,
		screenStyleInterpolator: ({ current, progress }) => {
			"worklet";
			const baseScale = interpolate(progress, [0, 1, 2], [0, 1, 0.92], "clamp");
			const translateX = current.gesture.x * 0.9;

			const translateY = current.gesture.y * 0.9;

			return {
				content: {
					style: {
						transform: [{ translateX }, { translateY }, { scale: baseScale }],
					},
				},
			};
		},
		transitionSpec: DEFAULT_SPEC,
	};
}

function buildPinchOptions(
	direction: "pinch-in" | "pinch-out",
): ScreenTransitionConfig {
	const isPinchIn = direction === "pinch-in";

	return {
		gestureEnabled: true,
		gestureDirection: [direction, "horizontal", "vertical"],
		gestureSensitivity: 0.75,
		snapPoints: isPinchIn ? [0.5, 1.0] : undefined,
		screenStyleInterpolator: ({ progress }) => {
			"worklet";

			const baseScale = interpolate(
				progress,
				[0, 1, 2],
				isPinchIn ? [0, 1, 0.92] : [2, 1, 0],
			);

			return {
				content: {
					style: {
						opacity: interpolate(progress, [0, 1, 2], [0, 1, 0.92], "clamp"),
						transform: [{ scale: baseScale }],
					},
				},
			};
		},
		transitionSpec: DEFAULT_SPEC,
	};
}

function buildSnapMultiAxisOptions(): ScreenTransitionConfig {
	return {
		gestureEnabled: true,
		gestureDirection: ["horizontal", "vertical-inverted"],
		gestureReleaseVelocityScale: 0,
		snapPoints: [0.45, 0.75, 1],
		gestureSensitivity: 0.85,
		screenStyleInterpolator: ({
			current,
			progress,
			layouts: {
				screen: { width },
			},
		}) => {
			"worklet";

			const baseTranslateX = interpolate(progress, [0, 1], [width, 0], "clamp");
			const translateX =
				baseTranslateX + current.gesture.x * GESTURE_RESISTANCE;
			const translateY = current.gesture.y * GESTURE_RESISTANCE;
			const scale = interpolate(progress, [0, 1, 2], [0, 1, 0.94], "clamp");
			const opacity = interpolate(progress, [0, 1], [0, 1], "clamp");

			return {
				content: {
					style: {
						opacity,
						transform: [{ translateX }, { translateY }, { scale }],
					},
				},
			};
		},
		transitionSpec: DEFAULT_SPEC,
	};
}

function buildSnapOrderAxisOptions(): ScreenTransitionConfig {
	return {
		gestureEnabled: true,
		gestureDirection: ["vertical-inverted", "vertical"],
		gestureReleaseVelocityScale: 0,
		snapPoints: [0.4, 0.7, 1],
		gestureSensitivity: 0.85,
		screenStyleInterpolator: ({
			current,
			progress,
			layouts: {
				screen: { height },
			},
		}) => {
			"worklet";

			const baseTranslateY = interpolate(
				progress,
				[0, 1],
				[-height, 0],
				"clamp",
			);
			const translateY =
				baseTranslateY + current.gesture.y * GESTURE_RESISTANCE;
			const scale = interpolate(progress, [0, 1, 2], [0, 1, 0.94], "clamp");
			const opacity = interpolate(progress, [0, 1], [0, 1], "clamp");

			return {
				content: {
					style: {
						opacity,
						transform: [{ translateY }, { scale }],
					},
				},
			};
		},
		transitionSpec: DEFAULT_SPEC,
	};
}

function buildSnapPinchPanOptions(): ScreenTransitionConfig {
	return {
		gestureEnabled: true,
		gestureDirection: ["pinch-out", "horizontal", "vertical-inverted"],
		gestureReleaseVelocityScale: 0,
		snapPoints: [0.45, 0.72, 1],
		gestureSensitivity: 0.8,
		screenStyleInterpolator: ({
			current,
			progress,
			layouts: {
				screen: { width },
			},
		}) => {
			"worklet";

			const baseTranslateX = interpolate(progress, [0, 1], [width, 0], "clamp");
			const translateX =
				baseTranslateX + current.gesture.x * GESTURE_RESISTANCE;
			const translateY = current.gesture.y * GESTURE_RESISTANCE;
			const pinchScale = 1 + current.gesture.normScale * GESTURE_RESISTANCE;
			const progressScale = interpolate(
				progress,
				[0, 1, 2],
				[0, 1, 0.9],
				"clamp",
			);
			const opacity = interpolate(progress, [0, 1], [0, 1], "clamp");

			return {
				content: {
					style: {
						opacity,
						transform: [
							{ translateX },
							{ translateY },
							{ scale: progressScale * pinchScale },
						],
					},
				},
			};
		},
		transitionSpec: DEFAULT_SPEC,
	};
}

function buildSnapPinchOnlyOptions(): ScreenTransitionConfig {
	return {
		gestureEnabled: true,
		gestureDirection: "pinch-in",
		gestureReleaseVelocityScale: 0,
		snapPoints: [0.45, 0.75, 1],
		gestureSensitivity: 0.75,
		screenStyleInterpolator: ({ current, progress }) => {
			"worklet";

			const pinchScale =
				1 - Math.abs(current.gesture.normScale) * GESTURE_RESISTANCE;
			const progressScale = interpolate(
				progress,
				[0, 1, 2],
				[0, 1, 1.12],
				"clamp",
			);
			const opacity = interpolate(progress, [0, 1], [0, 1], "clamp");

			return {
				content: {
					style: {
						opacity,
						transform: [{ scale: progressScale * pinchScale }],
					},
				},
			};
		},
		transitionSpec: DEFAULT_SPEC,
	};
}

function buildDynamicRuntimeOptions(): ScreenTransitionConfig {
	return {
		gestureEnabled: true,
		gestureDirection: "horizontal",
		screenStyleInterpolator: ({ current, progress }) => {
			"worklet";

			const translateX = current.gesture.x * 0.85;
			const translateY = current.gesture.y * 0.85;
			const pinchScale = 1 - Math.abs(current.gesture.normScale) * 0.25;
			const progressScale = interpolate(
				progress,
				[0, 1, 2],
				[0.95, 1, 0.96],
				"clamp",
			);

			return {
				content: {
					style: {
						transform: [
							{ translateX },
							{ translateY },
							{ scale: progressScale * pinchScale },
						],
					},
				},
			};
		},
		transitionSpec: DEFAULT_SPEC,
	};
}

export const GESTURE_SCREEN_OPTIONS: Record<GestureExampleId, any> = {
	horizontal: buildHorizontalOptions(false),
	"horizontal-inverted": buildHorizontalOptions(true),
	vertical: buildVerticalOptions(false),
	"vertical-inverted": buildVerticalOptions(true),
	bidirectional: buildBidirectionalOptions(),
	"pinch-in": buildPinchOptions("pinch-in"),
	"pinch-out": buildPinchOptions("pinch-out"),
	"snap-multi-axis": buildSnapMultiAxisOptions(),
	"snap-order-axis": buildSnapOrderAxisOptions(),
	"snap-pinch-pan": buildSnapPinchPanOptions(),
	"snap-pinch-only": buildSnapPinchOnlyOptions(),
	"dynamic-runtime": buildDynamicRuntimeOptions(),
};
