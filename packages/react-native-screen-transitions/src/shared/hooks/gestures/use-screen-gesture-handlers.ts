import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import type {
	GestureStateChangeEvent,
	GestureTouchEvent,
	GestureUpdateEvent,
	PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import type { GestureStateManagerType } from "react-native-gesture-handler/lib/typescript/handlers/gestures/gestureStateManager";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { DefaultSnapSpec } from "../../configs/specs";
import {
	DEFAULT_GESTURE_ACTIVATION_AREA,
	DEFAULT_GESTURE_DIRECTION,
	DEFAULT_GESTURE_DRIVES_PROGRESS,
	EPSILON,
	FALSE,
	GESTURE_VELOCITY_IMPACT,
	TRUE,
} from "../../constants";
import type { ScrollConfig } from "../../providers/gestures.provider";
import { useKeys } from "../../providers/screen/keys.provider";
import { AnimationStore } from "../../stores/animation.store";
import { GestureStore } from "../../stores/gesture.store";
import { GestureOffsetState } from "../../types/gesture.types";
import { animateToProgress } from "../../utils/animation/animate-to-progress";
import {
	applyOffsetRules,
	checkScrollAwareActivation,
} from "../../utils/gesture/check-gesture-activation";
import { determineDismissal } from "../../utils/gesture/determine-dismissal";
import { determineSnapTarget } from "../../utils/gesture/determine-snap-target";
import { mapGestureToProgress } from "../../utils/gesture/map-gesture-to-progress";
import { resetGestureValues } from "../../utils/gesture/reset-gesture-values";
import { validateSnapPoints } from "../../utils/gesture/validate-snap-points";
import { velocity } from "../../utils/gesture/velocity";
import { logger } from "../../utils/logger";
import useStableCallbackValue from "../use-stable-callback-value";

interface UseScreenGestureHandlersProps {
	scrollConfig: SharedValue<ScrollConfig | null>;
	ancestorIsDismissing?: SharedValue<number> | null;
	canDismiss: boolean;
	handleDismiss: () => void;
}

export const useScreenGestureHandlers = ({
	scrollConfig,
	ancestorIsDismissing,
	canDismiss,
	handleDismiss,
}: UseScreenGestureHandlersProps) => {
	const dimensions = useWindowDimensions();
	const { current } = useKeys();

	const animations = AnimationStore.getAll(current.route.key);
	const gestureAnimationValues = GestureStore.getRouteGestures(
		current.route.key,
	);

	const {
		gestureDirection = DEFAULT_GESTURE_DIRECTION,
		gestureDrivesProgress = DEFAULT_GESTURE_DRIVES_PROGRESS,
		gestureVelocityImpact = GESTURE_VELOCITY_IMPACT,
		gestureActivationArea = DEFAULT_GESTURE_ACTIVATION_AREA,
		gestureResponseDistance,
		transitionSpec,
		snapPoints: rawSnapPoints,
	} = current.options;

	const { hasSnapPoints, snapPoints, minSnapPoint, maxSnapPoint } = useMemo(
		() => validateSnapPoints({ snapPoints: rawSnapPoints, canDismiss }),
		[rawSnapPoints, canDismiss],
	);

	const directions = useMemo(() => {
		if (hasSnapPoints && Array.isArray(gestureDirection)) {
			/**
			 * Unsure if this behavior will change in the future, as I cannot find a use case as to why
			 * you would want multiple gesture dismisals for a sheet.
			 *
			 * e.g. When defining a snap point with a gesture of vertical ( default ), the system
			 * assumes that the inverse ( vertical-inverted ), will grow the sheet.
			 */
			logger.warn(
				`gestureDirection array is not supported with snapPoints. ` +
					`Only the first direction "${gestureDirection[0]}" will be used. ` +
					`Snap points define a single axis of movement, so only one gesture direction is needed.`,
			);
		}

		// When snap points are defined, use only the first direction from the array
		const effectiveDirection = hasSnapPoints
			? Array.isArray(gestureDirection)
				? gestureDirection[0]
				: gestureDirection
			: gestureDirection;

		const directionsArray = Array.isArray(effectiveDirection)
			? effectiveDirection
			: [effectiveDirection];

		const isBidirectional = directionsArray.includes("bidirectional");

		const hasHorizontalDirection =
			directionsArray.includes("horizontal") ||
			directionsArray.includes("horizontal-inverted");

		const isSnapAxisInverted = hasHorizontalDirection
			? directionsArray.includes("horizontal-inverted") &&
				!directionsArray.includes("horizontal")
			: directionsArray.includes("vertical-inverted") &&
				!directionsArray.includes("vertical");

		const enableBothVertical =
			isBidirectional || (hasSnapPoints && !hasHorizontalDirection);
		const enableBothHorizontal =
			isBidirectional || (hasSnapPoints && hasHorizontalDirection);

		return {
			vertical: directionsArray.includes("vertical") || enableBothVertical,
			verticalInverted:
				directionsArray.includes("vertical-inverted") || enableBothVertical,
			horizontal:
				directionsArray.includes("horizontal") || enableBothHorizontal,
			horizontalInverted:
				directionsArray.includes("horizontal-inverted") || enableBothHorizontal,
			snapAxisInverted: hasSnapPoints && isSnapAxisInverted,
		};
	}, [gestureDirection, hasSnapPoints]);

	const snapAxis =
		directions.horizontal || directions.horizontalInverted
			? "horizontal"
			: "vertical";

	const initialTouch = useSharedValue({ x: 0, y: 0 });
	const gestureOffsetState = useSharedValue<GestureOffsetState>(
		GestureOffsetState.PENDING,
	);
	const gestureStartProgress = useSharedValue(1);

	const onTouchesDown = useStableCallbackValue((e: GestureTouchEvent) => {
		"worklet";
		const firstTouch = e.changedTouches[0];
		initialTouch.value = { x: firstTouch.x, y: firstTouch.y };
		gestureOffsetState.value = GestureOffsetState.PENDING;
	});

	const onTouchesMove = useStableCallbackValue(
		(e: GestureTouchEvent, manager: GestureStateManagerType) => {
			"worklet";

			// If an ancestor navigator is already dismissing via gesture, block new gestures here.
			if (ancestorIsDismissing?.value) {
				gestureOffsetState.value = GestureOffsetState.FAILED;
				manager.fail();
				return;
			}

			const touch = e.changedTouches[0];

			const { isSwipingDown, isSwipingUp, isSwipingRight, isSwipingLeft } =
				applyOffsetRules({
					touch,
					directions,
					manager,
					dimensions,
					gestureOffsetState,
					initialTouch: initialTouch.value,
					activationArea: gestureActivationArea,
					responseDistance: gestureResponseDistance,
				});

			if (gestureOffsetState.value === GestureOffsetState.FAILED) {
				manager.fail();
				return;
			}

			// Keep pending until thresholds are met; no eager activation.
			if (gestureAnimationValues.isDragging?.value) {
				manager.activate();
				return;
			}

			const recognizedDirection =
				isSwipingDown || isSwipingUp || isSwipingRight || isSwipingLeft;

			const scrollCfg = scrollConfig.value;
			const isTouchingScrollView = scrollCfg?.isTouched ?? false;

			if (!isTouchingScrollView) {
				// Early return if gesture hasn't met activation criteria
				const canActivate =
					recognizedDirection &&
					gestureOffsetState.value === GestureOffsetState.PASSED &&
					!gestureAnimationValues.isDismissing?.value;

				if (!canActivate) {
					return;
				}

				if (isSwipingDown) {
					gestureAnimationValues.direction.value = "vertical";
				} else if (isSwipingUp) {
					gestureAnimationValues.direction.value = "vertical-inverted";
				} else if (isSwipingRight) {
					gestureAnimationValues.direction.value = "horizontal";
				} else if (isSwipingLeft) {
					gestureAnimationValues.direction.value = "horizontal-inverted";
				}

				manager.activate();
				return;
			}

			// Touch IS on ScrollView - apply scroll-aware rules
			// Snap mode: determine if sheet can still expand
			const canExpandMore =
				hasSnapPoints && animations.progress.value < maxSnapPoint - EPSILON;

			const { shouldActivate, direction: activatedDirection } =
				checkScrollAwareActivation({
					swipeInfo: {
						isSwipingDown,
						isSwipingUp,
						isSwipingRight,
						isSwipingLeft,
					},
					directions,
					scrollConfig: scrollCfg,
					hasSnapPoints,
					canExpandMore,
				});

			if (recognizedDirection && !shouldActivate) {
				manager.fail();
				return;
			}

			if (
				shouldActivate &&
				gestureOffsetState.value === GestureOffsetState.PASSED &&
				!gestureAnimationValues.isDismissing?.value
			) {
				gestureAnimationValues.direction.value = activatedDirection;
				manager.activate();
				return;
			}
		},
	);

	const onStart = useStableCallbackValue(() => {
		"worklet";
		gestureAnimationValues.isDragging.value = TRUE;
		gestureAnimationValues.isDismissing.value = FALSE;
		gestureStartProgress.value = animations.progress.value;
		animations.animating.value = TRUE;
	});

	const onUpdate = useStableCallbackValue(
		(event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
			"worklet";

			const { translationX, translationY } = event;
			const { width, height } = dimensions;

			gestureAnimationValues.x.value = translationX;
			gestureAnimationValues.y.value = translationY;
			gestureAnimationValues.normalizedX.value = velocity.normalizeTranslation(
				translationX,
				width,
			);
			gestureAnimationValues.normalizedY.value = velocity.normalizeTranslation(
				translationY,
				height,
			);

			if (hasSnapPoints && gestureDrivesProgress) {
				const isHorizontal = snapAxis === "horizontal";
				const translation = isHorizontal ? translationX : translationY;
				const dimension = isHorizontal ? width : height;

				// Map translation to progress delta:
				// - Positive translation (down/right) = decrease progress (dismiss)
				// - Negative translation (up/left) = increase progress (expand)
				// Inverted directions flip this behavior
				const baseSign = -1;
				const sign = directions.snapAxisInverted ? -baseSign : baseSign;
				const progressDelta = (sign * translation) / dimension;

				// Use pre-computed bounds (minSnapPoint already accounts for canDismiss)
				animations.progress.value = Math.max(
					minSnapPoint,
					Math.min(maxSnapPoint, gestureStartProgress.value + progressDelta),
				);
			} else if (gestureDrivesProgress) {
				let maxProgress = 0;

				// Horizontal swipe right (positive X)
				if (directions.horizontal && translationX > 0) {
					const progress = mapGestureToProgress(translationX, width);
					maxProgress = Math.max(maxProgress, progress);
				}

				// Horizontal inverted swipe left (negative X)
				if (directions.horizontalInverted && translationX < 0) {
					const progress = mapGestureToProgress(-translationX, width);
					maxProgress = Math.max(maxProgress, progress);
				}

				// Vertical swipe down (positive Y)
				if (directions.vertical && translationY > 0) {
					const progress = mapGestureToProgress(translationY, height);
					maxProgress = Math.max(maxProgress, progress);
				}

				// Vertical inverted swipe up (negative Y)
				if (directions.verticalInverted && translationY < 0) {
					const progress = mapGestureToProgress(-translationY, height);
					maxProgress = Math.max(maxProgress, progress);
				}

				animations.progress.value = Math.max(
					0,
					Math.min(1, gestureStartProgress.value - maxProgress),
				);
			}
		},
	);

	const onEnd = useStableCallbackValue(
		(event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
			"worklet";

			if (hasSnapPoints) {
				const isHorizontal = snapAxis === "horizontal";
				const axisVelocity = isHorizontal ? event.velocityX : event.velocityY;
				const axisDimension = isHorizontal
					? dimensions.width
					: dimensions.height;

				// determineSnapTarget expects positive velocity = toward dismiss (decreasing progress)
				// Positive velocity (down/right) = dismiss for non-inverted
				// Inverted directions need velocity flipped
				const snapVelocity = directions.snapAxisInverted
					? -axisVelocity
					: axisVelocity;

				const result = determineSnapTarget({
					currentProgress: animations.progress.value,
					snapPoints,
					velocity: snapVelocity,
					dimension: axisDimension,
					canDismiss: canDismiss,
				});

				const shouldDismiss = result.shouldDismiss;
				const targetProgress = result.targetProgress;
				const isSnapping = !shouldDismiss;

				const spec = shouldDismiss
					? transitionSpec?.close
					: transitionSpec?.open;

				const effectiveSpec = isSnapping
					? {
							open: transitionSpec?.expand ?? DefaultSnapSpec,
							close: transitionSpec?.collapse ?? DefaultSnapSpec,
						}
					: transitionSpec;

				resetGestureValues({
					spec,
					gestures: gestureAnimationValues,
					shouldDismiss,
					event,
					dimensions,
				});

				// For snap transitions, velocity should match gesture direction
				// Positive gesture velocity (down/right) = collapsing (negative progress velocity)
				// Inverted directions flip this
				const velocitySign = directions.snapAxisInverted ? 1 : -1;
				const initialVelocity =
					velocitySign * velocity.normalize(axisVelocity, axisDimension);

				animateToProgress({
					target: targetProgress,
					onAnimationFinish: shouldDismiss ? handleDismiss : undefined,
					spec: effectiveSpec,
					animations,
					initialVelocity,
				});
			} else {
				const result = determineDismissal({
					event,
					directions,
					dimensions,
					gestureVelocityImpact,
				});

				const shouldDismiss = result.shouldDismiss;
				const targetProgress = shouldDismiss ? 0 : gestureStartProgress.value;

				resetGestureValues({
					spec: shouldDismiss ? transitionSpec?.close : transitionSpec?.open,
					gestures: gestureAnimationValues,
					shouldDismiss,
					event,
					dimensions,
				});

				const initialVelocity = velocity.calculateProgressVelocity({
					animations,
					shouldDismiss,
					event,
					dimensions,
					directions,
				});

				animateToProgress({
					target: targetProgress,
					onAnimationFinish: shouldDismiss ? handleDismiss : undefined,
					spec: transitionSpec,
					animations,
					initialVelocity,
				});
			}
		},
	);

	return { onTouchesDown, onTouchesMove, onStart, onUpdate, onEnd };
};
