import { useWindowDimensions } from "react-native";
import type {
	GestureStateChangeEvent,
	GestureUpdateEvent,
	PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import { DefaultSnapSpec } from "../../../configs/specs";
import { TRUE } from "../../../constants";
import { useNavigationHelpers } from "../../../hooks/navigation/use-navigation-helpers";
import useStableCallbackValue from "../../../hooks/use-stable-callback-value";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";
import { clampVelocity } from "../helpers/gesture-directions";
import {
	normalizeGestureTranslation,
	normalizeVelocity,
} from "../helpers/gesture-physics";
import { resetGestureValues } from "../helpers/gesture-reset";
import {
	findNearestSnapPoint,
	resolveRuntimeSnapPoints,
} from "../helpers/gesture-snap-points";
import { determineSnapTarget } from "../helpers/gesture-targets";
import type { PanGestureRuntime } from "../types";

export const useSnapPanBehavior = ({
	config,
	policy,
	stores,
	gestureStartProgress,
	lockedSnapPoint,
}: PanGestureRuntime) => {
	const { dismissScreen } = useNavigationHelpers();
	const dimensions = useWindowDimensions();

	const { hasAutoSnapPoint, snapPoints, minSnapPoint, maxSnapPoint } =
		config.effectiveSnapPoints;

	const onStart = useStableCallbackValue(() => {
		"worklet";
		const { resolvedSnapPoints, resolvedMaxSnapPoint } =
			resolveRuntimeSnapPoints({
				snapPoints,
				hasAutoSnapPoint,
				resolvedAutoSnapPoint: stores.resolvedAutoSnapPointValue.value,
				minSnapPoint,
				maxSnapPoint,
				canDismiss: config.canDismiss,
			});

		if (policy.gestureSnapLocked) {
			lockedSnapPoint.value = findNearestSnapPoint(
				stores.animations.progress.value,
				resolvedSnapPoints,
			);
		} else {
			lockedSnapPoint.value = resolvedMaxSnapPoint;
		}

		stores.animations.willAnimate.value = TRUE;
		stores.gestureAnimationValues.dragging.value = TRUE;
		stores.gestureAnimationValues.dismissing.value = 0;
		gestureStartProgress.value = stores.animations.progress.value;
	});

	const onUpdate = useStableCallbackValue(
		(event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
			"worklet";

			if (stores.animations.willAnimate.value) {
				stores.animations.willAnimate.value = 0;
			}

			const { translationX, translationY } = event;
			const { width, height } = dimensions;

			stores.gestureAnimationValues.x.value = translationX;
			stores.gestureAnimationValues.y.value = translationY;
			stores.gestureAnimationValues.normX.value = normalizeGestureTranslation(
				translationX,
				width,
			);
			stores.gestureAnimationValues.normY.value = normalizeGestureTranslation(
				translationY,
				height,
			);

			if (!policy.gestureDrivesProgress) {
				return;
			}

			const isHorizontal = policy.snapAxis === "horizontal";
			const translation = isHorizontal ? translationX : translationY;
			const dimension = isHorizontal ? width : height;
			const baseSign = -1;
			const sign = policy.directions.snapAxisInverted ? -baseSign : baseSign;
			const progressDelta = (sign * translation) / dimension;

			const { resolvedMinSnapPoint, resolvedMaxSnapPoint } =
				resolveRuntimeSnapPoints({
					snapPoints,
					hasAutoSnapPoint,
					resolvedAutoSnapPoint: stores.resolvedAutoSnapPointValue.value,
					minSnapPoint,
					maxSnapPoint,
					canDismiss: config.canDismiss,
				});

			const maxProgressForGesture = policy.gestureSnapLocked
				? lockedSnapPoint.value
				: resolvedMaxSnapPoint;
			const minProgressForGesture = policy.gestureSnapLocked
				? config.canDismiss
					? 0
					: lockedSnapPoint.value
				: resolvedMinSnapPoint;

			stores.animations.progress.value = Math.max(
				minProgressForGesture,
				Math.min(
					maxProgressForGesture,
					gestureStartProgress.value + progressDelta,
				),
			);
		},
	);

	const onEnd = useStableCallbackValue(
		(event: GestureStateChangeEvent<PanGestureHandlerEventPayload>) => {
			"worklet";

			stores.animations.willAnimate.value = 0;

			const isHorizontal = policy.snapAxis === "horizontal";
			const axisVelocity = isHorizontal ? event.velocityX : event.velocityY;
			const axisDimension = isHorizontal ? dimensions.width : dimensions.height;
			const snapVelocity = policy.directions.snapAxisInverted
				? -axisVelocity
				: axisVelocity;

			const { resolvedSnapPoints } = resolveRuntimeSnapPoints({
				snapPoints,
				hasAutoSnapPoint,
				resolvedAutoSnapPoint: stores.resolvedAutoSnapPointValue.value,
				minSnapPoint,
				maxSnapPoint,
				canDismiss: config.canDismiss,
			});

			const result = determineSnapTarget({
				currentProgress: stores.animations.progress.value,
				snapPoints: policy.gestureSnapLocked
					? [lockedSnapPoint.value]
					: resolvedSnapPoints,
				velocity: snapVelocity,
				dimension: axisDimension,
				velocityFactor: policy.snapVelocityImpact,
				canDismiss: config.canDismiss,
			});

			const shouldDismiss = result.shouldDismiss;
			const targetProgress = result.targetProgress;
			const isSnapping = !shouldDismiss;

			const spec = shouldDismiss
				? policy.transitionSpec?.close
				: policy.transitionSpec?.open;
			const effectiveSpec = isSnapping
				? {
						open: policy.transitionSpec?.expand ?? DefaultSnapSpec,
						close: policy.transitionSpec?.collapse ?? DefaultSnapSpec,
					}
				: policy.transitionSpec;

			resetGestureValues({
				spec,
				gestures: stores.gestureAnimationValues,
				shouldDismiss,
				event,
				dimensions,
				gestureReleaseVelocityScale: policy.gestureReleaseVelocityScale,
				gestureReleaseVelocityMax: policy.gestureReleaseVelocityMax,
			});

			const snapDirection = Math.sign(
				targetProgress - stores.animations.progress.value,
			);
			const normalizedAxisVelocity = Math.abs(
				normalizeVelocity(
					axisVelocity,
					axisDimension,
					policy.gestureReleaseVelocityMax,
				),
			);
			const signedSnapVelocity =
				snapDirection *
				normalizedAxisVelocity *
				policy.gestureReleaseVelocityScale;
			const initialVelocity =
				snapDirection === 0
					? 0
					: clampVelocity(signedSnapVelocity, policy.gestureReleaseVelocityMax);

			animateToProgress({
				target: targetProgress,
				onAnimationFinish: shouldDismiss ? dismissScreen : undefined,
				spec: effectiveSpec,
				animations: stores.animations,
				targetProgress: stores.targetProgressValue,
				emitWillAnimate: false,
				initialVelocity,
			});
		},
	);

	return { onStart, onUpdate, onEnd };
};
