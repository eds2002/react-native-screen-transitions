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

function buildHorizontalOptions(inverted: boolean) {
	return {
		gestureEnabled: true,
		gestureDirection: inverted ? "horizontal-inverted" : "horizontal",
		screenStyleInterpolator: ({
			progress,
			layouts: {
				screen: { width },
			},
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
		gestureDirection: direction,
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

export const GESTURE_SCREEN_OPTIONS: Record<GestureExampleId, any> = {
	horizontal: buildHorizontalOptions(false),
	"horizontal-inverted": buildHorizontalOptions(true),
	vertical: buildVerticalOptions(false),
	"vertical-inverted": buildVerticalOptions(true),
	bidirectional: buildBidirectionalOptions(),
	"pinch-in": buildPinchOptions("pinch-in"),
	"pinch-out": buildPinchOptions("pinch-out"),
};
