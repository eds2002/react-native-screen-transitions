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
import type {
	DirectionClaimMap,
	GestureContextType,
	ScrollConfig,
} from "../../providers/gestures.provider";
import { useKeys } from "../../providers/screen/keys.provider";
import { AnimationStore } from "../../stores/animation.store";
import { GestureStore } from "../../stores/gesture.store";
import { GestureOffsetState } from "../../types/gesture.types";
import type {
	ClaimedDirections,
	Direction,
	DirectionOwnership,
} from "../../types/ownership.types";
import { animateToProgress } from "../../utils/animation/animate-to-progress";
import {
	applyOffsetRules,
	checkScrollBoundary,
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
	ownershipStatus: DirectionOwnership;
	claimedDirections: ClaimedDirections;
	ancestorContext: GestureContextType | null | undefined;
	childDirectionClaims: SharedValue<DirectionClaimMap>;
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
export const useScreenGestureHandlers = ({
	scrollConfig,
	ancestorIsDismissing,
	canDismiss,
	handleDismiss,
	ownershipStatus,
	claimedDirections,
	ancestorContext,
	childDirectionClaims,
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
		expandViaScrollView = true,
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

		// Reset isTouched - ScrollView's onTouchStart will set it true if touch is on ScrollView
		const cfg = scrollConfig.value;
		if (cfg) {
			cfg.isTouched = false;
		}
	});

	const routeKey = current.route.key;

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

			if (gestureAnimationValues.isDragging?.value) {
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
			// ALSO: Ignore claims from children that are currently dismissing
			const childClaim = childDirectionClaims.value[swipeDirection];
			if (
				childClaim &&
				childClaim.routeKey !== routeKey &&
				!childClaim.isDismissing.value
			) {
				manager.fail();
				return;
			}

			if (gestureOffsetState.value !== GestureOffsetState.PASSED) {
				return;
			}

			// Snap sheets can interrupt their own animation; non-snap cannot
			if (!hasSnapPoints && gestureAnimationValues.isDismissing?.value) {
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
					const isExpandGesture =
						(directions.snapAxisInverted && swipeDirection === "vertical") ||
						(!directions.snapAxisInverted &&
							swipeDirection === "vertical-inverted") ||
						(directions.snapAxisInverted && swipeDirection === "horizontal") ||
						(!directions.snapAxisInverted &&
							swipeDirection === "horizontal-inverted");

					if (isExpandGesture) {
						if (!expandViaScrollView) {
							manager.fail();
							return;
						}

						const canExpandMore =
							animations.progress.value < maxSnapPoint - EPSILON &&
							animations.targetProgress.value < maxSnapPoint - EPSILON;

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

				// Map translation to progress: positive = dismiss, negative = expand
				const baseSign = -1;
				const sign = directions.snapAxisInverted ? -baseSign : baseSign;
				const progressDelta = (sign * translation) / dimension;

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

				// Normalize velocity: positive = toward dismiss
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
				const targetProgress = shouldDismiss ? 0 : 1;

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
