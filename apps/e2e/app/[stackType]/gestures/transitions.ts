// @ts-nocheck
import { interpolate, makeMutable } from "react-native-reanimated";
import Transition, {
	type ScreenTransitionConfig,
} from "react-native-screen-transitions";
import type { GestureExampleId } from "./shared";

const DEFAULT_SPEC = {
	open: Transition.Specs.DefaultSpec,
	close: Transition.Specs.DefaultSpec,
};

const GESTURE_RESISTANCE = 0.45;

type DynamicSensitivityDriver = "x" | "y" | "xy" | "pinch";

type DynamicSensitivityConfig = {
	driver: DynamicSensitivityDriver;
	base?: number;
	min?: number;
	distance?: number;
};

export const gestureSensitivityMultiplier = makeMutable(1);

function resolveDynamicGestureSensitivity(
	rawGesture: any,
	config: DynamicSensitivityConfig,
) {
	"worklet";
	const driver = config.driver;
	const multiplier = gestureSensitivityMultiplier.get();
	const min = multiplier;
	const distance = config.distance ?? 0.25;
	let amount = 0;

	if (driver === "x") {
		amount = Math.abs(rawGesture.normX);
	} else if (driver === "y") {
		amount = Math.abs(rawGesture.normY);
	} else if (driver === "xy") {
		amount = Math.max(Math.abs(rawGesture.normX), Math.abs(rawGesture.normY));
	} else {
		amount = Math.abs(rawGesture.normScale);
	}

	return interpolate(amount, [0, distance], [1, min], "clamp");
}

function gestureRuntimeOptions(
	rawGesture: any,
	config: DynamicSensitivityConfig,
) {
	"worklet";
	return {
		gestures: {
			gestureSensitivity: resolveDynamicGestureSensitivity(rawGesture, config),
		},
	};
}

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
				options: gestureRuntimeOptions(active.gesture.raw, { driver: "x" }),
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
			active,
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
				options: gestureRuntimeOptions(active.gesture.raw, { driver: "y" }),
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

function buildNestedOptions(): ScreenTransitionConfig {
	const disabledSensitivity = {
		driver: "y",
		base: 0.16,
		min: 0.02,
		distance: 0.3,
	} as const;

	return {
		gestureEnabled: true,
		gestureDirection: "vertical",
		gestureReleaseVelocityScale: 0,
		screenStyleInterpolator: ({
			active,
			progress,
			layouts: {
				screen: { height },
			},
		}) => {
			"worklet";
			const disabledGestureSensitivity = resolveDynamicGestureSensitivity(
				active.gesture.raw,
				disabledSensitivity,
			);
			const gestureSensitivity =
				active.options.gestureEnabled === false
					? disabledGestureSensitivity
					: 1;
			const translateY = interpolate(
				progress,
				[0, 1, 2],
				[height, 0, height * 0.18],
				"clamp",
			);

			return {
				options: {
					gestures: {
						gestureSensitivity,
					},
				},
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
		screenStyleInterpolator: ({ active, current, progress }) => {
			"worklet";
			const baseScale = interpolate(progress, [0, 1, 2], [0, 1, 0.92], "clamp");
			const translateX = current.gesture.x * 0.9;

			const translateY = current.gesture.y * 0.9;

			return {
				options: gestureRuntimeOptions(active.gesture.raw, { driver: "xy" }),
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
	const gestureSensitivity = {
		driver: "pinch",
		base: 0.75,
		min: 0.12,
		distance: 0.22,
	} as const;

	return {
		gestureEnabled: true,
		gestureDirection: [direction, "horizontal", "vertical"],
		gestureSensitivity: gestureSensitivity.base,
		snapPoints: isPinchIn ? [0.5, 1.0] : undefined,
		screenStyleInterpolator: ({ active, progress }) => {
			"worklet";

			const baseScale = interpolate(
				progress,
				[0, 1, 2],
				isPinchIn ? [0, 1, 0.92] : [2, 1, 0],
			);

			return {
				options: gestureRuntimeOptions(active.gesture.raw, gestureSensitivity),
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
	const gestureSensitivity = {
		driver: "xy",
		base: 0.85,
		min: 0.12,
	} as const;

	return {
		gestureEnabled: true,
		gestureDirection: ["horizontal", "vertical-inverted"],
		gestureReleaseVelocityScale: 0,
		snapPoints: [0.45, 0.75, 1],
		gestureSensitivity: gestureSensitivity.base,
		screenStyleInterpolator: ({
			active,
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
				options: gestureRuntimeOptions(active.gesture.raw, gestureSensitivity),
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
	const gestureSensitivity = {
		driver: "y",
		base: 0.85,
		min: 0.12,
	} as const;

	return {
		gestureEnabled: true,
		gestureDirection: ["vertical-inverted", "vertical"],
		gestureReleaseVelocityScale: 0,
		snapPoints: [0.4, 0.7, 1],
		gestureSensitivity: gestureSensitivity.base,
		screenStyleInterpolator: ({
			active,
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
				options: gestureRuntimeOptions(active.gesture.raw, gestureSensitivity),
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
	const gestureSensitivity = {
		driver: "xy",
		base: 0.8,
		min: 0.12,
	} as const;

	return {
		gestureEnabled: true,
		gestureDirection: ["pinch-out", "horizontal", "vertical-inverted"],
		gestureReleaseVelocityScale: 0,
		snapPoints: [0.45, 0.72, 1],
		gestureSensitivity: gestureSensitivity.base,
		screenStyleInterpolator: ({
			active,
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
			const progressScale = interpolate(
				progress,
				[0, 1, 2],
				[0, 1, 0.9],
				"clamp",
			);
			const opacity = interpolate(progress, [0, 1], [0, 1], "clamp");

			return {
				options: gestureRuntimeOptions(active.gesture.raw, gestureSensitivity),
				content: {
					style: {
						opacity,
						transform: [
							{ translateX },
							{ translateY },
							{ scale: progressScale },
						],
					},
				},
			};
		},
		transitionSpec: DEFAULT_SPEC,
	};
}

function buildSnapPinchOnlyOptions(): ScreenTransitionConfig {
	const gestureSensitivity = {
		driver: "pinch",
		base: 0.75,
		min: 0.12,
		distance: 0.22,
	} as const;

	return {
		gestureEnabled: true,
		gestureDirection: "pinch-in",
		gestureReleaseVelocityScale: 0,
		snapPoints: [0.45, 0.75, 1],
		gestureSensitivity: gestureSensitivity.base,
		screenStyleInterpolator: ({ active, progress }) => {
			"worklet";

			const progressScale = interpolate(
				progress,
				[0, 1, 2],
				[0, 1, 1.12],
				"clamp",
			);
			const opacity = interpolate(progress, [0, 1], [0, 1], "clamp");

			return {
				options: gestureRuntimeOptions(active.gesture.raw, gestureSensitivity),
				content: {
					style: {
						opacity,
						transform: [{ scale: progressScale }],
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
		screenStyleInterpolator: ({ active, current, progress }) => {
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
				options: gestureRuntimeOptions(active.gesture.raw, { driver: "xy" }),
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

export function buildGestureScreenOptions(id: GestureExampleId) {
	switch (id) {
		case "horizontal":
			return buildHorizontalOptions(false);
		case "horizontal-inverted":
			return buildHorizontalOptions(true);
		case "vertical":
			return buildVerticalOptions(false);
		case "vertical-inverted":
			return buildVerticalOptions(true);
		case "bidirectional":
			return buildBidirectionalOptions();
		case "pinch-in":
			return buildPinchOptions("pinch-in");
		case "pinch-out":
			return buildPinchOptions("pinch-out");
		case "snap-multi-axis":
			return buildSnapMultiAxisOptions();
		case "snap-order-axis":
			return buildSnapOrderAxisOptions();
		case "snap-pinch-pan":
			return buildSnapPinchPanOptions();
		case "snap-pinch-only":
			return buildSnapPinchOnlyOptions();
		case "dynamic-runtime":
			return buildDynamicRuntimeOptions();
		case "nested":
			return buildNestedOptions();
	}
}

export const GESTURE_SCREEN_OPTIONS: Record<GestureExampleId, any> = {
	horizontal: buildGestureScreenOptions("horizontal"),
	"horizontal-inverted": buildGestureScreenOptions("horizontal-inverted"),
	vertical: buildGestureScreenOptions("vertical"),
	"vertical-inverted": buildGestureScreenOptions("vertical-inverted"),
	bidirectional: buildGestureScreenOptions("bidirectional"),
	"pinch-in": buildGestureScreenOptions("pinch-in"),
	"pinch-out": buildGestureScreenOptions("pinch-out"),
	"snap-multi-axis": buildGestureScreenOptions("snap-multi-axis"),
	"snap-order-axis": buildGestureScreenOptions("snap-order-axis"),
	"snap-pinch-pan": buildGestureScreenOptions("snap-pinch-pan"),
	"snap-pinch-only": buildGestureScreenOptions("snap-pinch-only"),
	"dynamic-runtime": buildGestureScreenOptions("dynamic-runtime"),
	nested: buildGestureScreenOptions("nested"),
};
