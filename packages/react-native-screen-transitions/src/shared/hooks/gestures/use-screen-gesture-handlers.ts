import { useMemo } from "react";
import type {
	GestureStateChangeEvent,
	GestureTouchEvent,
	GestureUpdateEvent,
	PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import type { GestureStateManagerType } from "react-native-gesture-handler/lib/typescript/handlers/gestures/gestureStateManager";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { DefaultSnapSpec } from "../../configs/specs";
import { FALSE, TRUE } from "../../constants";
import type { ScrollConfig } from "../../providers/gestures.provider";
import type { AnimationStoreMap } from "../../stores/animation.store";
import type { GestureStoreMap } from "../../stores/gesture.store";
import type { TransitionSpec } from "../../types/animation.types";
import {
	type GestureActivationArea,
	type GestureDirection,
	GestureOffsetState,
} from "../../types/gesture.types";
import type { Layout } from "../../types/screen.types";
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
	dimensions: Layout;
	animations: AnimationStoreMap;
	gestureAnimationValues: GestureStoreMap;
	gestureDirection: GestureDirection | GestureDirection[];
	gestureDrivesProgress: boolean;
	gestureVelocityImpact: number;
	scrollConfig: SharedValue<ScrollConfig | null>;
	gestureActivationArea: GestureActivationArea;
	gestureResponseDistance?: number;
	ancestorIsDismissing?: SharedValue<number> | null;
	snapPoints?: number[];
	canDismiss: boolean;
	transitionSpec?: TransitionSpec;
	handleDismiss: () => void;
}

export const useScreenGestureHandlers = ({
	dimensions,
	animations,
	gestureAnimationValues,
	gestureDirection,
	gestureDrivesProgress,
	gestureVelocityImpact,
	scrollConfig,
	gestureActivationArea,
	gestureResponseDistance,
	ancestorIsDismissing,
	snapPoints: rawSnapPoints,
	canDismiss,
	transitionSpec,
	handleDismiss,
}: UseScreenGestureHandlersProps) => {
	const { hasSnapPoints, snapPoints, minSnapPoint, maxSnapPoint } = useMemo(
		() => validateSnapPoints({ snapPoints: rawSnapPoints, canDismiss }),
		[rawSnapPoints, canDismiss],
	);

	const directions = useMemo(() => {
		if (hasSnapPoints && Array.isArray(gestureDirection)) {
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
				gestureOffsetState.set(GestureOffsetState.FAILED);
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
					gestureAnimationValues.direction.set("vertical");
				} else if (isSwipingUp) {
					gestureAnimationValues.direction.set("vertical-inverted");
				} else if (isSwipingRight) {
					gestureAnimationValues.direction.set("horizontal");
				} else if (isSwipingLeft) {
					gestureAnimationValues.direction.set("horizontal-inverted");
				}

				manager.activate();
				return;
			}

			// Touch IS on ScrollView - apply scroll-aware rules
			const scrollX = scrollCfg?.x ?? 0;
			const scrollY = scrollCfg?.y ?? 0;
			const maxScrollX = scrollCfg?.contentWidth
				? scrollCfg.contentWidth - scrollCfg.layoutWidth
				: 0;
			const maxScrollY = scrollCfg?.contentHeight
				? scrollCfg.contentHeight - scrollCfg.layoutHeight
				: 0;

			// Snap mode: determine if sheet can still expand
			const canExpandMore =
				hasSnapPoints && animations.progress.value < maxSnapPoint - 0.01;

			const { shouldActivate, direction: activatedDirection } =
				checkScrollAwareActivation({
					swipeInfo: {
						isSwipingDown,
						isSwipingUp,
						isSwipingRight,
						isSwipingLeft,
					},
					directions,
					scrollX,
					scrollY,
					maxScrollX,
					maxScrollY,
					hasSnapPoints,
					canExpandMore,
					snapAxisInverted: directions.snapAxisInverted,
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
		animations.settled.value = FALSE;
	});

	const onUpdate = useStableCallbackValue(
		(event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
			"worklet";

			const { translationX, translationY } = event;
			const { width, height } = dimensions;

			// Update gesture values (shared across all modes)
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
				// Snap mode: bidirectional tracking on snap axis
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
				// Standard mode: find max progress across allowed directions
				const axes = [
					{
						enabled: directions.horizontal,
						translation: translationX,
						dimension: width,
						sign: 1,
					},
					{
						enabled: directions.horizontalInverted,
						translation: translationX,
						dimension: width,
						sign: -1,
					},
					{
						enabled: directions.vertical,
						translation: translationY,
						dimension: height,
						sign: 1,
					},
					{
						enabled: directions.verticalInverted,
						translation: translationY,
						dimension: height,
						sign: -1,
					},
				];

				let maxProgress = 0;
				for (const axis of axes) {
					if (axis.enabled && axis.translation * axis.sign > 0) {
						const progress = mapGestureToProgress(
							Math.abs(axis.translation),
							axis.dimension,
						);
						maxProgress = Math.max(maxProgress, progress);
					}
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
				// Standard mode: use determineDismissal
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
