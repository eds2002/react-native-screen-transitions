import { Gesture } from "react-native-gesture-handler";
import {
	interpolate,
	runOnJS,
	type SharedValue,
} from "react-native-reanimated";
import { animationValues } from "../../animation-engine";
import type { GestureDirection, RouteState } from "../../types";
import { animate } from "../animate";
import { createGestureActivationCriteria } from "./create-gesture-activation-criteria";
import { mapGestureToProgress } from "./map-gesture-to-progress";

const GESTURE_VELOCITY_IMPACT = 0.3;
const DEFAULT_GESTURE_RESPONSE_DISTANCE = 50;

interface BuildGestureDetectorProps {
	key: string;
	progress: SharedValue<number>;
	config: RouteState;
	width: number;
	height: number;
	goBack: () => void;
}

export const normalizeGestureTranslation = (
	translation: number,
	gestureDirection: GestureDirection,
) => {
	"worklet";
	const isInverted = gestureDirection.includes("inverted");

	const translated = Math.abs(translation) * (isInverted ? -1 : 1);

	if (isInverted) {
		return Math.min(0, translated);
	}

	return Math.max(0, translated);
};

export const buildGestureDetector = ({
	key,
	progress,
	config,
	width,
	height,
	goBack,
}: BuildGestureDetectorProps) => {
	const _translateX = animationValues.gestureX[key];
	const _translateY = animationValues.gestureY[key];
	const _normalizedGestureX = animationValues.normalizedGestureX[key];
	const _normalizedGestureY = animationValues.normalizedGestureY[key];
	const _isDragging = animationValues.gestureDragging[key];

	const {
		gestureDirection = "horizontal",
		gestureEnabled = false,
		transitionSpec,
		gestureVelocityImpact = GESTURE_VELOCITY_IMPACT,
		gestureResponseDistance = DEFAULT_GESTURE_RESPONSE_DISTANCE,
	} = config;

	const directions = Array.isArray(gestureDirection)
		? gestureDirection
		: [gestureDirection];

	const panGesture = Gesture.Pan()
		.enabled(gestureEnabled)
		.onStart(() => {
			"worklet";
			_isDragging.value = 1;
		})
		.onUpdate((event) => {
			"worklet";
			let gestureProgress = 0;

			_translateX.value = event.translationX;
			_translateY.value = event.translationY;
			_normalizedGestureX.value = interpolate(
				event.translationX,
				[-width, width],
				[-1, 1],
				"clamp",
			);
			_normalizedGestureY.value = interpolate(
				event.translationY,
				[-height, height],
				[-1, 1],
				"clamp",
			);

			if (directions.includes("bidirectional")) {
				const distance = Math.sqrt(
					event.translationX ** 2 + event.translationY ** 2,
				);
				gestureProgress = mapGestureToProgress(distance, width);
			} else {
				let maxProgress = 0;

				const allowedDown = directions.includes("vertical");
				const allowedUp = directions.includes("vertical-inverted");
				const allowedRight = directions.includes("horizontal");
				const allowedLeft = directions.includes("horizontal-inverted");

				if (allowedRight || allowedLeft) {
					const absX = Math.abs(event.translationX);
					const currentProgress = mapGestureToProgress(absX, width);
					maxProgress = Math.max(maxProgress, currentProgress);
				}

				if (allowedUp || allowedDown) {
					const absY = Math.abs(event.translationY);
					const currentProgress = mapGestureToProgress(absY, height);
					maxProgress = Math.max(maxProgress, currentProgress);
				}

				gestureProgress = maxProgress;
			}

			progress.value = 1 - gestureProgress;
		})
		.onEnd((event) => {
			"worklet";
			const { translationX, translationY, velocityX, velocityY } = event;

			let shouldDismiss = false;
			const dismissThreshold = 0.5;

			if (directions.includes("bidirectional")) {
				const finalX = Math.abs(
					translationX + velocityX * gestureVelocityImpact,
				);
				const finalY = Math.abs(
					translationY + velocityY * gestureVelocityImpact,
				);
				const finalDistance = Math.sqrt(finalX ** 2 + finalY ** 2);
				shouldDismiss = finalDistance > width * dismissThreshold;
			} else {
				const allowedDown = directions.includes("vertical");
				const allowedUp = directions.includes("vertical-inverted");
				const allowedRight = directions.includes("horizontal");
				const allowedLeft = directions.includes("horizontal-inverted");

				if (
					allowedRight &&
					translationX + velocityX * gestureVelocityImpact >
						width * dismissThreshold
				) {
					shouldDismiss = true;
				} else if (
					allowedLeft &&
					-translationX - velocityX * gestureVelocityImpact >
						width * dismissThreshold
				) {
					shouldDismiss = true;
				} else if (
					allowedDown &&
					translationY + velocityY * gestureVelocityImpact >
						height * dismissThreshold
				) {
					shouldDismiss = true;
				} else if (
					allowedUp &&
					-translationY - velocityY * gestureVelocityImpact >
						height * dismissThreshold
				) {
					shouldDismiss = true;
				}
			}

			const finalProgress = shouldDismiss ? 0 : 1;
			const spec = shouldDismiss ? transitionSpec?.close : transitionSpec?.open;

			const onFinish = shouldDismiss
				? (isFinished?: boolean) => {
						"worklet";
						if (isFinished) runOnJS(goBack)();
					}
				: undefined;

			progress.value = animate(finalProgress, spec, onFinish);

			_translateX.value = animate(0, spec);
			_translateY.value = animate(0, spec);
			_normalizedGestureX.value = animate(0, spec);
			_normalizedGestureY.value = animate(0, spec);
		});

	const criteria = createGestureActivationCriteria({
		gestureDirection,
		gestureResponseDistance,
	});

	if (criteria?.activeOffsetX) {
		panGesture.activeOffsetX(criteria.activeOffsetX);
	}
	if (criteria?.activeOffsetY) {
		panGesture.activeOffsetY(criteria.activeOffsetY);
	}
	if (criteria?.failOffsetX) {
		panGesture.failOffsetX(criteria.failOffsetX);
	}
	if (criteria?.failOffsetY) {
		panGesture.failOffsetY(criteria.failOffsetY);
	}

	panGesture.enableTrackpadTwoFingerGesture(true);
	const nativeGesture = Gesture.Native().shouldCancelWhenOutside(false);

	return Gesture.Race(panGesture, nativeGesture);
};
