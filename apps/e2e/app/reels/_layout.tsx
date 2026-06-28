import { Platform } from "react-native";
import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition, {
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import { REELS_GROUP } from "./constants";

const REELS_MAX_GESTURE_SENSITIVITY = 0.8;
const REELS_DRAG_SCALE_MIN = 0.25;
const REELS_DRAG_SCALE_MAX = 1.06;
const REELS_DRAG_SCALE_EXPONENT = 2;
const REELS_ORBIT_PERSPECTIVE = 850;
const REELS_MASK_BLEED = 160;

type ReelsGesture = Parameters<
	NonNullable<ScreenTransitionConfig["screenStyleInterpolator"]>
>[0]["active"]["gesture"];

type ReelsRoute = {
	params?: object;
};

function getReelIndexParam(route: ReelsRoute | undefined) {
	"worklet";

	const params = route?.params as Record<string, unknown> | undefined;
	const rawIndex = params?.index;

	if (typeof rawIndex === "number") {
		return rawIndex;
	}

	if (typeof rawIndex !== "string") {
		return null;
	}

	const index = Number(rawIndex);
	return Number.isFinite(index) ? index : null;
}

function resolveReelsBoundsId(params: {
	activeRoute: ReelsRoute;
	currentRoute: ReelsRoute;
	nextRoute: ReelsRoute | undefined;
}) {
	"worklet";

	const { activeRoute, currentRoute, nextRoute } = params;
	const index =
		getReelIndexParam(activeRoute) ??
		getReelIndexParam(nextRoute) ??
		getReelIndexParam(currentRoute);

	return index === null ? null : `reel-${index}`;
}

function clampUnit(value: number) {
	"worklet";

	return Math.min(1, Math.max(0, value));
}

function mixUnit(from: number, to: number, progress: number) {
	"worklet";

	const unit = clampUnit(progress);
	return from + (to - from) * unit;
}

function interpolateClamped(
	value: number,
	inputStart: number,
	inputEnd: number,
	outputStart: number,
	outputEnd: number,
) {
	"worklet";

	return mixUnit(
		outputStart,
		outputEnd,
		(value - inputStart) / (inputEnd - inputStart),
	);
}

function resolveReelsGestureOptions(rawDrag: number) {
	"worklet";

	const clampedRawDrag = clampUnit(rawDrag);
	const gestureSensitivity = mixUnit(
		REELS_MAX_GESTURE_SENSITIVITY,
		0.1,
		clampedRawDrag,
	);
	const releaseBoost = mixUnit(1, 1.1, clampedRawDrag);
	const releaseSensitivity = interpolateClamped(
		gestureSensitivity,
		0.28,
		0.9,
		0.7,
		1,
	);

	return {
		gestureProgressMode: "freeform" as const,
		gestureSensitivity,
		gestureReleaseVelocityScale: releaseBoost * releaseSensitivity,
	};
}

function resolveReelsRawDrag(gesture: ReelsGesture) {
	"worklet";

	const initialGesture = gesture.active ?? gesture.direction;
	const raw = gesture.raw ?? gesture;

	if (
		initialGesture === "horizontal" ||
		initialGesture === "horizontal-inverted"
	) {
		return Math.abs(raw.normX);
	}

	if (initialGesture === "vertical" || initialGesture === "vertical-inverted") {
		return Math.abs(raw.normY);
	}

	return Math.min(1, Math.max(Math.abs(raw.normX), Math.abs(raw.normY)));
}

function resolveReelsDragTranslation({
	translation,
	dimension,
}: {
	translation: number;
	dimension: number;
}) {
	"worklet";

	const baseDistance = Math.max(1, dimension);
	const clampedMagnitude = Math.min(1, Math.abs(translation) / baseDistance);
	const resolved = baseDistance * clampedMagnitude;

	if (translation < 0) {
		return -resolved;
	}

	return resolved;
}

function resolveDirectionalReelsDragScale({
	normalized,
	dismissDirection,
}: {
	normalized: number;
	dismissDirection: "positive" | "negative";
}) {
	"worklet";

	const dismissalRelative =
		dismissDirection === "negative" ? -normalized : normalized;

	if (dismissalRelative >= 0) {
		const rawScale = mixUnit(1, REELS_DRAG_SCALE_MIN, dismissalRelative);
		return rawScale ** REELS_DRAG_SCALE_EXPONENT;
	}

	return mixUnit(1, REELS_DRAG_SCALE_MAX, Math.abs(dismissalRelative));
}

function resolveReelsDragScale(gesture: ReelsGesture) {
	"worklet";

	const initialGesture = gesture.active ?? gesture.direction;

	if (
		initialGesture === "horizontal" ||
		initialGesture === "horizontal-inverted"
	) {
		return resolveDirectionalReelsDragScale({
			normalized: gesture.normX,
			dismissDirection:
				initialGesture === "horizontal-inverted" ? "negative" : "positive",
		});
	}

	if (initialGesture === "vertical" || initialGesture === "vertical-inverted") {
		return resolveDirectionalReelsDragScale({
			normalized: gesture.normY,
			dismissDirection:
				initialGesture === "vertical-inverted" ? "negative" : "positive",
		});
	}

	const magnitude = Math.sqrt(
		gesture.normX * gesture.normX + gesture.normY * gesture.normY,
	);

	return resolveDirectionalReelsDragScale({
		normalized: Math.min(1, magnitude),
		dismissDirection: "positive",
	});
}

function resolveReelsScaleHandoff({
	progress,
	releaseScale,
	targetScale,
}: {
	progress: number;
	releaseScale: number;
	targetScale: number;
}) {
	"worklet";

	const closeProgress = 1 - progress;
	const scaleProgress = Math.sin((Math.PI / 2) * closeProgress);

	return releaseScale + (targetScale - releaseScale) * scaleProgress;
}

function resolveCenterScaleShift({
	center,
	containerCenter,
	scale,
}: {
	center: number;
	containerCenter: number;
	scale: number;
}) {
	"worklet";

	return (center - containerCenter) * (scale - 1);
}

function resolveReelsOrbitMotion({
	motionProgress,
	startCenterX,
	screenWidth,
	screenHeight,
	velocity,
	gesture,
}: {
	motionProgress: number;
	startCenterX: number;
	screenWidth: number;
	screenHeight: number;
	velocity: number;
	gesture: ReelsGesture;
}) {
	"worklet";

	const safeScreenWidth = Math.max(1, screenWidth);
	const safeScreenHeight = Math.max(1, screenHeight);
	const arc = Math.sin(motionProgress * Math.PI);
	const sweep = motionProgress * Math.PI * 2;
	const screenBias = (startCenterX / safeScreenWidth) * 2 - 1;
	const absGestureX = Math.abs(gesture.normX);
	const absGestureY = Math.abs(gesture.normY);
	const hasHorizontalIntent = absGestureX >= absGestureY && absGestureX > 0.025;
	const hasVerticalIntent = absGestureY > absGestureX && absGestureY > 0.025;
	const horizontalSide = hasHorizontalIntent
		? gesture.normX < 0
			? -1
			: 1
		: screenBias < 0
			? -1
			: 1;
	const verticalSide = gesture.normY < 0 ? -1 : 1;
	const inward = -horizontalSide;
	const horizontalRadius = Math.min(118, Math.max(48, safeScreenWidth * 0.18));
	const verticalRadius = Math.min(76, Math.max(32, safeScreenHeight * 0.09));
	const horizontalLoopX =
		inward * horizontalRadius * arc * (0.56 + Math.cos(sweep) * 0.44);
	const horizontalLoopY =
		verticalRadius * arc * Math.sin(sweep) * (0.7 + Math.abs(screenBias) * 0.3);
	const verticalLoopX =
		screenBias * horizontalRadius * 0.36 * arc * Math.sin(sweep);
	const verticalLoopY =
		verticalSide * verticalRadius * arc * (0.52 + Math.cos(sweep) * 0.32);
	const loopX = hasVerticalIntent ? verticalLoopX : horizontalLoopX;
	const loopY = hasVerticalIntent ? verticalLoopY : horizontalLoopY;
	const wobbleY = Math.sin(motionProgress * Math.PI * 3) * 14 * arc;
	const velocityStrength = Math.min(1, Math.max(0, Math.abs(velocity)));
	const rotationDepth = 0.55 + velocityStrength * 1.35;
	const velocityDip = Math.min(Math.max(velocity * 0.05 * arc, -0.12), 0.12);
	const horizontalBank =
		inward *
		(arc * 26 + Math.sin(sweep) * 14 + velocityStrength * arc * 28) *
		rotationDepth;
	const verticalBank =
		screenBias * Math.sin(sweep) * (6 + velocityStrength * 14) * arc;
	const rotateX = hasVerticalIntent
		? -verticalSide * arc * (30 + velocityStrength * 38) * rotationDepth
		: arc * (20 + velocityStrength * 34) * rotationDepth;
	const rotateY = hasVerticalIntent
		? screenBias * arc * (8 + velocityStrength * 16) * rotationDepth
		: inward * arc * -(12 + velocityStrength * 28) * rotationDepth;
	const transformOrigin = hasVerticalIntent
		? verticalSide > 0
			? "50% 0%"
			: "50% 100%"
		: horizontalSide < 0
			? "0% 50%"
			: "100% 50%";

	return {
		x: loopX,
		y: loopY + wobbleY,
		scale: 1 + arc * 0.035 - velocityDip,
		rotate: hasVerticalIntent ? verticalBank : horizontalBank,
		rotateX,
		rotateY,
		perspective: REELS_ORBIT_PERSPECTIVE,
		transformOrigin,
	};
}

/**
 * Param-scoped reels interpolator. The player route's `index` param selects
 * the feed card for the whole transition; scrolling inside the player does
 * not retarget the shared group.
 */
const reelsInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] = ({
	bounds,
	focused,
	active,
	current,
	next,
	layouts: { screen },
	progress,
}) => {
	"worklet";

	const id = resolveReelsBoundsId({
		activeRoute: active.route,
		currentRoute: current.route,
		nextRoute: next?.route,
	});

	if (!id) {
		return {};
	}

	const scoped = bounds({
		id,
		group: REELS_GROUP,
	});
	const link = scoped.link();

	if (!link) {
		return {};
	}

	const gesture = active.gesture;
	const dragX = resolveReelsDragTranslation({
		translation: gesture.x,
		dimension: screen.width,
	});
	const dragY = resolveReelsDragTranslation({
		translation: gesture.y,
		dimension: screen.height,
	});
	const rawDrag = resolveReelsRawDrag(gesture);
	const dragScale = resolveReelsDragScale(gesture);
	const gestureScale = gesture.dismissing
		? resolveReelsScaleHandoff({
				progress: active.progress,
				releaseScale: dragScale,
				targetScale: 1,
			})
		: dragScale;
	const options = resolveReelsGestureOptions(rawDrag);

	if (focused) {
		const mask = scoped.math({
			method: "size",
			space: "absolute",
			target: "fullscreen",
		});
		const maskBleed = interpolate(
			progress,
			[0, 1],
			[0, REELS_MASK_BLEED],
			"clamp",
		);
		const maskWidth = Math.max(1, mask.width + maskBleed * 2);
		const maskHeight = Math.max(1, mask.height + maskBleed * 2);
		const maskTranslateX = mask.translateX - maskBleed;
		const maskTranslateY = mask.translateY - maskBleed;

		return {
			options,
			content: {
				style: {
					transform: [
						{ translateX: dragX },
						{ translateY: dragY },
						{ scale: gestureScale },
					],
				},
			},
			[NAVIGATION_MASK_ELEMENT_STYLE_ID]: {
				style: {
					width: maskWidth,
					height: maskHeight,
					borderRadius: interpolate(progress, [0, 1], [0, 56]),
					borderCurve: "continuous",
					transform: [
						{ translateX: maskTranslateX },
						{ translateY: maskTranslateY },
					],
				} as any,
			},
		};
	}

	return {
		options,
		[link.id]: {
			style: scoped.styles() as any,
		},
	};
};

export default function ReelsLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="player"
				options={{
					gestureEnabled: true,
					gestureDirection: ["bidirectional"],
					gestureSensitivity: REELS_MAX_GESTURE_SENSITIVITY,
					navigationMaskEnabled: Platform.OS === "ios",
					gestureProgressMode: "freeform",
					gestureReleaseVelocityScale: 2.2,
					screenStyleInterpolator: reelsInterpolator,
					transitionSpec: {
						open: {
							stiffness: 500,
							damping: 1000,
							mass: 3,
							overshootClamping: false,
						},
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</BlankStack>
	);
}
