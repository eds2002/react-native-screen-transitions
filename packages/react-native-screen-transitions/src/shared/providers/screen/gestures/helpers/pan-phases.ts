import { clamp } from "react-native-reanimated";
import { EPSILON, FALSE, TRUE } from "../../../../constants";
import { animateToProgress } from "../../../../utils/animation/animate-to-progress";
import { emit } from "../../../../utils/animation/emit";
import type {
	GestureDimensions,
	PanGestureEvent,
	PanGestureRuntime,
	PanReleaseResult,
	PanTrackState,
} from "../types";
import { normalizeGestureTranslation } from "./gesture-physics";
import { resetGestureValues } from "./gesture-reset";

export const startPanBase = (runtime: PanGestureRuntime) => {
	"worklet";
	const {
		stores: { gestures, animations },
		gestureProgressBaseline,
	} = runtime;

	const wasSettling = gestures.settling.get();
	const hasResidualGesture =
		Math.abs(gestures.normX.get()) > EPSILON ||
		Math.abs(gestures.normY.get()) > EPSILON;

	if (!wasSettling || !hasResidualGesture) {
		emit(animations.willAnimate, TRUE, FALSE);
	}

	gestures.dragging.set(TRUE);
	gestures.dismissing.set(0);
	gestures.settling.set(0);
	gestures.x.set(0);
	gestures.y.set(0);
	gestures.normX.set(0);
	gestures.normY.set(0);
	gestures.raw.x.set(0);
	gestures.raw.y.set(0);
	gestures.raw.normX.set(0);
	gestures.raw.normY.set(0);
	gestureProgressBaseline.set(animations.progress.get());
};

export const trackPanGesture = (
	event: PanGestureEvent,
	rawEvent: PanGestureEvent,
	gestures: PanGestureRuntime["stores"]["gestures"],
	dimensions: GestureDimensions,
): PanTrackState => {
	"worklet";
	const { translationX: x, translationY: y } = event;
	const { translationX: rawX, translationY: rawY } = rawEvent;
	const { width, height } = dimensions;

	const normX = clamp(normalizeGestureTranslation(x, width), -1, 1);
	const normY = clamp(normalizeGestureTranslation(y, height), -1, 1);
	const rawNormX = clamp(normalizeGestureTranslation(rawX, width), -1, 1);
	const rawNormY = clamp(normalizeGestureTranslation(rawY, height), -1, 1);

	gestures.x.set(x);
	gestures.y.set(y);
	gestures.normX.set(normX);
	gestures.normY.set(normY);
	gestures.raw.x.set(rawX);
	gestures.raw.y.set(rawY);
	gestures.raw.normX.set(rawNormX);
	gestures.raw.normY.set(rawNormY);

	return {
		x,
		y,
		normX,
		normY,
	};
};

export const finalizePanRelease = (
	release: PanReleaseResult,
	runtime: PanGestureRuntime,
	dismissScreen: (() => void) | undefined,
	dimensions: GestureDimensions,
	rawEvent: PanGestureEvent,
) => {
	"worklet";
	const {
		policy,
		stores: { gestures, animations, system },
	} = runtime;
	const { width, height } = dimensions;

	const gestureDrivesProgress = policy.gestureDrivesProgress;
	const releaseVelocityScale = Math.max(0, policy.gestureReleaseVelocityScale);

	// When gestures do not drive progress, release velocity must stay off the
	// progress spring as well. Otherwise gestureDrivesProgress would only decouple
	// live drag, then recouple the release handoff. In that freeform mode the
	// gesture reset owns release velocity instead. This may change with more
	// feedback, but it keeps the current ownership model consistent.
	const gestureOwnsReset = !gestureDrivesProgress;
	const shouldResetNormalizedValues =
		!release.shouldDismiss || gestureDrivesProgress;

	const shouldUseResetVelocity = !release.shouldDismiss || gestureOwnsReset;

	const resetVelocityFactor = shouldUseResetVelocity ? 1 : 0;

	const resetVelocityX =
		rawEvent.velocityX * releaseVelocityScale * resetVelocityFactor;

	const resetVelocityY =
		rawEvent.velocityY * releaseVelocityScale * resetVelocityFactor;

	resetGestureValues({
		spec: release.resetSpec,
		gestures,
		shouldDismiss: release.shouldDismiss,
		velocityX: resetVelocityX,
		velocityY: resetVelocityY,
		velocityNormX: resetVelocityX / Math.max(1, width),
		velocityNormY: resetVelocityY / Math.max(1, height),
		resetNormalizedValues: shouldResetNormalizedValues,
	});

	const progressAlreadyAtTarget =
		Math.abs(animations.progress.get() - release.target) <= EPSILON;

	if (!release.shouldDismiss && progressAlreadyAtTarget) {
		system.targetProgress.set(release.target);
		animations.progressAnimating.set(FALSE);
		return;
	}

	animateToProgress({
		target: release.target,
		onAnimationFinish: release.shouldDismiss ? dismissScreen : undefined,
		spec: release.transitionSpec,
		emitWillAnimate: false,
		markEntering: false,
		targetProgress: system.targetProgress,
		animations,
		initialVelocity: gestureDrivesProgress ? release.initialVelocity : 0,
	});
};
