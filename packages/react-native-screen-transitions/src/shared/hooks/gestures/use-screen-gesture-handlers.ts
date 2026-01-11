import type {
	GestureStateChangeEvent,
	GestureTouchEvent,
	GestureUpdateEvent,
	PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import type { GestureStateManagerType } from "react-native-gesture-handler/lib/typescript/handlers/gestures/gestureStateManager";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { FALSE, TRUE } from "../../constants";
import type { ScrollConfig } from "../../providers/gestures.provider";
import type { AnimationStoreMap } from "../../stores/animation.store";
import type { GestureStoreMap } from "../../stores/gesture.store";
import type { TransitionSpec } from "../../types/animation.types";
import {
	type GestureActivationArea,
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
import { velocity } from "../../utils/gesture/velocity";
import useStableCallbackValue from "../use-stable-callback-value";

interface DirectionsMap {
	vertical: boolean;
	verticalInverted: boolean;
	horizontal: boolean;
	horizontalInverted: boolean;
	snapAxisInverted?: boolean;
}

interface UseScreenGestureHandlersProps {
	dimensions: Layout;
	animations: AnimationStoreMap;
	gestureAnimationValues: GestureStoreMap;

	// Direction config
	directions: DirectionsMap;
	gestureDrivesProgress: boolean;
	gestureVelocityImpact: number;

	// Activation config
	scrollConfig: SharedValue<ScrollConfig | null>;
	gestureActivationArea: GestureActivationArea;
	gestureResponseDistance?: number;
	ancestorIsDismissing?: SharedValue<number> | null;

	// Snap mode (optional - presence enables snap behavior)
	snapPoints?: number[];
	canDismiss?: boolean;

	transitionSpec?: TransitionSpec;
	handleDismiss: () => void;
}

const SNAP_SPRING = { damping: 50, stiffness: 500, mass: 1 };

export const useScreenGestureHandlers = ({
	dimensions,
	animations,
	gestureAnimationValues,
	directions,
	gestureDrivesProgress,
	gestureVelocityImpact,
	scrollConfig,
	gestureActivationArea,
	gestureResponseDistance,
	ancestorIsDismissing,
	snapPoints,
	canDismiss = true,
	transitionSpec,
	handleDismiss,
}: UseScreenGestureHandlersProps) => {
	const hasSnapPoints = Array.isArray(snapPoints) && snapPoints.length > 0;

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
			const scrollX = scrollCfg?.x ?? 0;
			const scrollY = scrollCfg?.y ?? 0;
			const maxScrollX = scrollCfg?.contentWidth
				? scrollCfg.contentWidth - scrollCfg.layoutWidth
				: 0;
			const maxScrollY = scrollCfg?.contentHeight
				? scrollCfg.contentHeight - scrollCfg.layoutHeight
				: 0;

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

				// For normal direction: positive translation (down/right) = decrease progress
				// For inverted direction: positive translation (down/right) = increase progress
				const sign = directions.snapAxisInverted ? 1 : -1;
				const progressDelta = (sign * translation) / dimension;

				const sortedSnaps = snapPoints.slice().sort((a, b) => a - b);
				// Clamp to snap point bounds (dismiss at 0 only if allowed)
				const minProgress = canDismiss ? 0 : sortedSnaps[0];
				const maxProgress = sortedSnaps[sortedSnaps.length - 1];

				animations.progress.value = Math.max(
					minProgress,
					Math.min(maxProgress, gestureStartProgress.value + progressDelta),
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

				// For inverted axes, flip velocity so determineSnapTarget interprets it correctly
				// (it expects positive velocity = toward dismiss)
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
					? { open: SNAP_SPRING, close: SNAP_SPRING }
					: transitionSpec;

				resetGestureValues({
					spec,
					gestures: gestureAnimationValues,
					shouldDismiss,
					event,
					dimensions,
				});

				// For snap transitions, velocity should match gesture direction
				// Sign flips for inverted directions
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
