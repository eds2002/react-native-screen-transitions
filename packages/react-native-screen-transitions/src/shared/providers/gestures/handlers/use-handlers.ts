import { useMemo } from "react";
import type {
	GestureStateChangeEvent,
	GestureTouchEvent,
	GestureUpdateEvent,
	PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import type { GestureStateManagerType } from "react-native-gesture-handler/lib/typescript/handlers/gestures/gestureStateManager";
import { type SharedValue, useSharedValue } from "react-native-reanimated";
import { DefaultSnapSpec } from "../../../configs/specs";
import {
	DEFAULT_GESTURE_ACTIVATION_AREA,
	DEFAULT_GESTURE_DIRECTION,
	DEFAULT_GESTURE_DRIVES_PROGRESS,
	DEFAULT_GESTURE_RELEASE_VELOCITY_MAX,
	DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
	DEFAULT_GESTURE_SNAP_LOCKED,
	DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
	DEFAULT_GESTURE_VELOCITY_IMPACT,
	EPSILON,
	FALSE,
	TRUE,
} from "../../../constants";
import useStableCallbackValue from "../../../hooks/use-stable-callback-value";
import { AnimationStore } from "../../../stores/animation.store";
import { GestureStore } from "../../../stores/gesture.store";
import { GestureOffsetState } from "../../../types/gesture.types";
import type {
	ClaimedDirections,
	Direction,
	DirectionOwnership,
} from "../../../types/ownership.types";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";
import type { EffectiveSnapPointsResult } from "../../../utils/gesture/validate-snap-points";
import { useDescriptors } from "../../screen/descriptors";
import { useViewportContext } from "../../viewport.provider";
import {
	applyOffsetRules,
	checkScrollBoundary,
} from "../helpers/gesture-activation";
import { shouldDeferToChildClaim } from "../helpers/gesture-claims";
import {
	clampVelocity,
	getSnapAxis,
	isExpandGestureForDirection,
	resolveGestureDirections,
	warnOnSnapDirectionArray,
} from "../helpers/gesture-directions";
import {
	calculateProgressSpringVelocity,
	mapGestureToProgress,
	normalizeGestureTranslation,
	normalizeVelocity,
} from "../helpers/gesture-physics";
import { resetGestureValues } from "../helpers/gesture-reset";
import {
	determineDismissal,
	determineSnapTarget,
} from "../helpers/gesture-targets";
import type {
	DirectionClaimMap,
	GestureContextType,
	ScrollConfig,
} from "../types";

interface UseScreenGestureHandlersProps {
	scrollConfig: SharedValue<ScrollConfig | null>;
	ancestorIsDismissing?: SharedValue<number> | null;
	canDismiss: boolean;
	handleDismiss: () => void;
	ownershipStatus: DirectionOwnership;
	claimedDirections: ClaimedDirections;
	ancestorContext: GestureContextType | null | undefined;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
	effectiveSnapPoints: EffectiveSnapPointsResult;
}

/**
 * Gesture Handlers for Screen Dismissal and Snap Navigation
 *
 * ## Mental Model
 *
 * This hook implements the touch handling logic for the gesture ownership system.
 * Each screen has a pan gesture handler that runs through this decision flow:
 *
 * ```
 * onTouchesMove (for each touch move event):
 *   1. ANCESTOR CHECK: If ancestor is dismissing → fail (avoid racing)
 *   2. DIRECTION DETECTION: Determine swipe direction from touch delta
 *   3. OWNERSHIP CHECK: Do we own this direction? (ownershipStatus)
 *      - "self" → continue
 *      - "ancestor" or null → fail (let it bubble up)
 *   4. CHILD CLAIM CHECK: Has a child pre-registered a claim for this direction?
 *      - Yes → fail immediately (child shadows us, no delay)
 *      - No → continue
 *   5. OFFSET THRESHOLD: Wait for sufficient touch movement
 *   6. SCROLLVIEW CHECK: If touch is on ScrollView, is it at boundary?
 *   7. EXPAND CHECK (snap sheets): If expanding via ScrollView, is expandViaScrollView enabled?
 *   8. ACTIVATE!
 * ```
 *
 * ## Key Concepts
 *
 * **Ownership**: Pre-computed at render time. "self" means this screen handles
 * the direction, "ancestor" means bubble up, null means no handler exists.
 *
 * **Child Claims**: Registered at mount time via useEffect in gestures.provider.tsx.
 * When a child shadows our direction, it pre-registers a claim so we know to defer.
 * IMPORTANT: This check happens BEFORE offset threshold to ensure the parent fails
 * immediately when shadowed, avoiding any perceptible delay.
 * ALSO: Claims from dismissing children are ignored, allowing the parent to handle
 * new gestures while the child is animating out.
 *
 * **ScrollView Boundaries**: Per spec, a ScrollView must be at its boundary before
 * yielding to gestures. The boundary depends on sheet type:
 * - Bottom sheet (vertical): scrollY = 0 (top)
 * - Top sheet (vertical-inverted): scrollY >= maxY (bottom)
 *
 * **Snap Points**: Sheets with snapPoints claim BOTH directions on their axis
 * (e.g., vertical sheet claims vertical AND vertical-inverted). This allows
 * expand (drag up) and collapse/dismiss (drag down) gestures.
 */
export const useHandlers = ({
	scrollConfig,
	ancestorIsDismissing,
	canDismiss,
	handleDismiss,
	ownershipStatus,
	childDirectionClaims,
	effectiveSnapPoints,
}: UseScreenGestureHandlersProps) => {
	const { current } = useDescriptors();

	const {
		gestureDirection = DEFAULT_GESTURE_DIRECTION,
		gestureDrivesProgress = DEFAULT_GESTURE_DRIVES_PROGRESS,
		gestureVelocityImpact = DEFAULT_GESTURE_VELOCITY_IMPACT,
		snapVelocityImpact = DEFAULT_GESTURE_SNAP_VELOCITY_IMPACT,
		gestureReleaseVelocityScale = DEFAULT_GESTURE_RELEASE_VELOCITY_SCALE,
		gestureReleaseVelocityMax = DEFAULT_GESTURE_RELEASE_VELOCITY_MAX,
		gestureActivationArea = DEFAULT_GESTURE_ACTIVATION_AREA,
		gestureSnapLocked = DEFAULT_GESTURE_SNAP_LOCKED,
		expandViaScrollView = true,
		gestureResponseDistance,
		transitionSpec,
	} = current.options;

	const { dimensions } = useViewportContext();
	const routeKey = current.route.key;
	const animations = AnimationStore.getAll(current.route.key);
	const gestureAnimationValues = GestureStore.getRouteGestures(
		current.route.key,
	);

	const { hasSnapPoints, snapPoints, minSnapPoint, maxSnapPoint } =
		effectiveSnapPoints;

	const directions = useMemo(() => {
		warnOnSnapDirectionArray({ gestureDirection, hasSnapPoints });
		return resolveGestureDirections({ gestureDirection, hasSnapPoints });
	}, [gestureDirection, hasSnapPoints]);

	const snapAxis = getSnapAxis(directions);

	const initialTouch = useSharedValue({ x: 0, y: 0 });
	const gestureOffsetState = useSharedValue<GestureOffsetState>(
		GestureOffsetState.PENDING,
	);
	const gestureStartProgress = useSharedValue(1);
	const lockedSnapPoint = useSharedValue(maxSnapPoint);

	const onTouchesDown = useStableCallbackValue((e: GestureTouchEvent) => {
		"worklet";
		const firstTouch = e.changedTouches[0];
		initialTouch.value = { x: firstTouch.x, y: firstTouch.y };
		gestureOffsetState.value = GestureOffsetState.PENDING;
	});

	const onTouchesMove = useStableCallbackValue(
		(e: GestureTouchEvent, manager: GestureStateManagerType) => {
			"worklet";

			// Step 1: Ancestor dismissing check
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

			if (gestureAnimationValues.dragging?.value) {
				manager.activate();
				return;
			}

			// Step 2: Direction detection
			let swipeDirection: Direction | null = null;
			if (isSwipingDown) swipeDirection = "vertical";
			else if (isSwipingUp) swipeDirection = "vertical-inverted";
			else if (isSwipingRight) swipeDirection = "horizontal";
			else if (isSwipingLeft) swipeDirection = "horizontal-inverted";

			if (!swipeDirection) {
				return;
			}

			// Step 3: Ownership check - fail if we don't own this direction
			const ownership = ownershipStatus[swipeDirection];
			if (ownership !== "self") {
				manager.fail();
				return;
			}

			// Step 4: Child claim check - fail EARLY if a child shadows this direction
			// This MUST happen before offset threshold to avoid delay when shadowing
			const childClaim = childDirectionClaims.value[swipeDirection];
			if (shouldDeferToChildClaim(childClaim, routeKey)) {
				manager.fail();
				return;
			}

			if (gestureOffsetState.value !== GestureOffsetState.PASSED) {
				return;
			}

			if (
				hasSnapPoints &&
				gestureSnapLocked &&
				isExpandGestureForDirection(
					swipeDirection,
					snapAxis,
					directions.snapAxisInverted ?? false,
				)
			) {
				manager.fail();
				return;
			}

			// Snap sheets can interrupt their own animation; non-snap cannot
			if (!hasSnapPoints && gestureAnimationValues.dismissing?.value) {
				return;
			}

			// Step 6: ScrollView boundary check
			const scrollCfg = scrollConfig.value;
			const isTouchingScrollView = scrollCfg?.isTouched ?? false;

			if (isTouchingScrollView) {
				const atBoundary = checkScrollBoundary(
					scrollCfg,
					swipeDirection,
					hasSnapPoints ? directions.snapAxisInverted : undefined,
				);

				if (!atBoundary) {
					manager.fail();
					return;
				}

				// Step 7: Expand check for snap sheets
				if (hasSnapPoints) {
					if (
						isExpandGestureForDirection(
							swipeDirection,
							snapAxis,
							directions.snapAxisInverted ?? false,
						)
					) {
						if (!expandViaScrollView) {
							manager.fail();
							return;
						}

						const effectiveMaxSnapPoint = gestureSnapLocked
							? lockedSnapPoint.value
							: maxSnapPoint;

						const canExpandMore =
							animations.progress.value < effectiveMaxSnapPoint - EPSILON &&
							animations.targetProgress.value < effectiveMaxSnapPoint - EPSILON;

						if (!canExpandMore) {
							manager.fail();
							return;
						}
					}
				}
			}

			gestureAnimationValues.direction.value = swipeDirection;
			manager.activate();
		},
	);

	const onStart = useStableCallbackValue(() => {
		"worklet";
		if (hasSnapPoints && gestureSnapLocked) {
			let nearest = snapPoints[0] ?? animations.progress.value;
			let smallestDistance = Math.abs(animations.progress.value - nearest);

			for (let i = 1; i < snapPoints.length; i++) {
				const point = snapPoints[i];
				const distance = Math.abs(animations.progress.value - point);
				if (distance < smallestDistance) {
					smallestDistance = distance;
					nearest = point;
				}
			}

			lockedSnapPoint.value = nearest;
		} else {
			lockedSnapPoint.value = maxSnapPoint;
		}

		gestureAnimationValues.dragging.value = TRUE;
		gestureAnimationValues.dismissing.value = FALSE;
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
			gestureAnimationValues.normX.value = normalizeGestureTranslation(
				translationX,
				width,
			);
			gestureAnimationValues.normY.value = normalizeGestureTranslation(
				translationY,
				height,
			);

			if (hasSnapPoints && gestureDrivesProgress) {
				const isHorizontal = snapAxis === "horizontal";
				const translation = isHorizontal ? translationX : translationY;
				const dimension = isHorizontal ? width : height;

				// Map translation to progress: positive = dismiss, negative = expand
				const baseSign = -1;
				const sign = directions.snapAxisInverted ? -baseSign : baseSign;
				const progressDelta = (sign * translation) / dimension;
				const maxProgressForGesture = gestureSnapLocked
					? lockedSnapPoint.value
					: maxSnapPoint;
				const minProgressForGesture = gestureSnapLocked
					? canDismiss
						? 0
						: lockedSnapPoint.value
					: minSnapPoint;

				animations.progress.value = Math.max(
					minProgressForGesture,
					Math.min(
						maxProgressForGesture,
						gestureStartProgress.value + progressDelta,
					),
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

				// Normalize velocity: positive = toward dismiss
				const snapVelocity = directions.snapAxisInverted
					? -axisVelocity
					: axisVelocity;

				const result = determineSnapTarget({
					currentProgress: animations.progress.value,
					snapPoints: gestureSnapLocked ? [lockedSnapPoint.value] : snapPoints,
					velocity: snapVelocity,
					dimension: axisDimension,
					velocityFactor: snapVelocityImpact,
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
					gestureReleaseVelocityScale,
					gestureReleaseVelocityMax,
				});

				const snapDirection = Math.sign(
					targetProgress - animations.progress.value,
				);

				const normalizedAxisVelocity = Math.abs(
					normalizeVelocity(
						axisVelocity,
						axisDimension,
						gestureReleaseVelocityMax,
					),
				);

				const signedSnapVelocity =
					snapDirection * normalizedAxisVelocity * gestureReleaseVelocityScale;

				const initialVelocity =
					snapDirection === 0
						? 0
						: clampVelocity(signedSnapVelocity, gestureReleaseVelocityMax);

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
				const targetProgress = shouldDismiss ? 0 : 1;

				resetGestureValues({
					spec: shouldDismiss ? transitionSpec?.close : transitionSpec?.open,
					gestures: gestureAnimationValues,
					shouldDismiss,
					event,
					dimensions,
					gestureReleaseVelocityScale,
					gestureReleaseVelocityMax,
				});

				const initialVelocity = calculateProgressSpringVelocity({
					animations,
					shouldDismiss,
					event,
					dimensions,
					directions,
				});

				const scaledInitialVelocity = clampVelocity(
					initialVelocity * gestureReleaseVelocityScale,
					gestureReleaseVelocityMax,
				);

				animateToProgress({
					target: targetProgress,
					onAnimationFinish: shouldDismiss ? handleDismiss : undefined,
					spec: transitionSpec,
					animations,
					initialVelocity: scaledInitialVelocity,
				});
			}
		},
	);

	return { onTouchesDown, onTouchesMove, onStart, onUpdate, onEnd };
};
