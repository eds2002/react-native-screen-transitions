import { EPSILON } from "../../../../../constants";
import type {
	ScreenTransitionOptions,
	TransitionInterpolatorOptions,
} from "../../../../../types/animation.types";
import type { Layout } from "../../../../../types/screen.types";
import { resolveGestureAffectedProgress } from "./gesture-progress";
import {
	computeAnimatedSnapIndex,
	computeTargetSnapIndex,
	getResolvedSnapBounds,
} from "./snap-points";
import type { BuiltState } from "./types";

const mergeTransitionOptions = (
	base: ScreenTransitionOptions,
	effective: TransitionInterpolatorOptions | undefined,
	slot: ScreenTransitionOptions,
): ScreenTransitionOptions => {
	"worklet";
	if (!effective) {
		return base;
	}

	slot.navigationMaskEnabled = base.navigationMaskEnabled;
	slot.gestureEnabled = effective.gestureEnabled ?? base.gestureEnabled;
	slot.gestureTracking = base.gestureTracking;
	slot.gestureDirection = effective.gestureDirection ?? base.gestureDirection;
	slot.gestureSensitivity =
		effective.gestureSensitivity ?? base.gestureSensitivity;
	slot.gestureVelocityImpact =
		effective.gestureVelocityImpact ?? base.gestureVelocityImpact;
	slot.gestureSnapVelocityImpact =
		effective.gestureSnapVelocityImpact ?? base.gestureSnapVelocityImpact;
	slot.gestureReleaseVelocityScale =
		effective.gestureReleaseVelocityScale ?? base.gestureReleaseVelocityScale;
	slot.gestureResponseDistance =
		effective.gestureResponseDistance ?? base.gestureResponseDistance;
	slot.gestureProgressMode =
		effective.gestureProgressMode ?? base.gestureProgressMode;
	slot.gestureDrivesProgress =
		effective.gestureDrivesProgress ?? base.gestureDrivesProgress;
	slot.gestureActivationArea =
		effective.gestureActivationArea ?? base.gestureActivationArea;
	slot.gestureSnapLocked =
		effective.gestureSnapLocked ?? base.gestureSnapLocked;
	slot.sheetScrollGestureBehavior =
		effective.sheetScrollGestureBehavior ?? base.sheetScrollGestureBehavior;
	slot.backdropBehavior = effective.backdropBehavior ?? base.backdropBehavior;

	return slot;
};

export const hydrateTransitionState = (
	s: BuiltState,
	dimensions: Layout,
	effectiveOptions?: TransitionInterpolatorOptions,
) => {
	"worklet";
	const out = s.unwrapped;
	const transitionProgress = s.transitionProgress.get();
	const options = mergeTransitionOptions(
		s.options,
		effectiveOptions,
		s.optionsSlot,
	);
	const canDismiss = options.gestureEnabled !== false;
	out.transitionProgress = transitionProgress;
	out.willAnimate = s.willAnimate.get();
	out.closing = s.closing.get();
	out.entering = s.entering.get();
	out.gesture.x = s.gesture.x.get();
	out.gesture.y = s.gesture.y.get();
	out.gesture.normX = s.gesture.normX.get();
	out.gesture.normY = s.gesture.normY.get();
	out.gesture.velocity = s.gesture.velocity.get();
	out.gesture.scale = s.gesture.scale.get();
	out.gesture.normScale = s.gesture.normScale.get();
	out.gesture.focalX = s.gesture.focalX.get();
	out.gesture.focalY = s.gesture.focalY.get();
	out.gesture.rotation = s.gesture.rotation.get();
	out.gesture.raw.x = s.gesture.raw.x.get();
	out.gesture.raw.y = s.gesture.raw.y.get();
	out.gesture.raw.normX = s.gesture.raw.normX.get();
	out.gesture.raw.normY = s.gesture.raw.normY.get();
	out.gesture.raw.scale = s.gesture.raw.scale.get();
	out.gesture.raw.normScale = s.gesture.raw.normScale.get();
	out.gesture.raw.rotation = s.gesture.raw.rotation.get();
	out.gesture.dismissing = s.gesture.dismissing.get();
	out.gesture.dragging = s.gesture.dragging.get();
	out.gesture.settling = s.gesture.settling.get();
	out.gesture.active = s.gesture.active.get();
	out.gesture.direction = s.gesture.direction.get();
	const handoff = out.gesture.handoff;
	const useHandoffSnapshot = out.gesture.dismissing;

	handoff.x = useHandoffSnapshot
		? s.gesture.internal.snapshot.x.get()
		: out.gesture.x;
	handoff.y = useHandoffSnapshot
		? s.gesture.internal.snapshot.y.get()
		: out.gesture.y;
	handoff.normX = useHandoffSnapshot
		? s.gesture.internal.snapshot.normX.get()
		: out.gesture.normX;
	handoff.normY = useHandoffSnapshot
		? s.gesture.internal.snapshot.normY.get()
		: out.gesture.normY;
	handoff.velocity = useHandoffSnapshot
		? s.gesture.internal.snapshot.velocity.get()
		: out.gesture.velocity;
	handoff.scale = useHandoffSnapshot
		? s.gesture.internal.snapshot.scale.get()
		: out.gesture.scale;
	handoff.normScale = useHandoffSnapshot
		? s.gesture.internal.snapshot.normScale.get()
		: out.gesture.normScale;
	handoff.focalX = useHandoffSnapshot
		? s.gesture.internal.snapshot.focalX.get()
		: out.gesture.focalX;
	handoff.focalY = useHandoffSnapshot
		? s.gesture.internal.snapshot.focalY.get()
		: out.gesture.focalY;
	handoff.rotation = useHandoffSnapshot
		? s.gesture.internal.snapshot.rotation.get()
		: out.gesture.rotation;
	handoff.raw.x = useHandoffSnapshot
		? s.gesture.internal.snapshot.raw.x.get()
		: out.gesture.raw.x;
	handoff.raw.y = useHandoffSnapshot
		? s.gesture.internal.snapshot.raw.y.get()
		: out.gesture.raw.y;
	handoff.raw.normX = useHandoffSnapshot
		? s.gesture.internal.snapshot.raw.normX.get()
		: out.gesture.raw.normX;
	handoff.raw.normY = useHandoffSnapshot
		? s.gesture.internal.snapshot.raw.normY.get()
		: out.gesture.raw.normY;
	handoff.raw.scale = useHandoffSnapshot
		? s.gesture.internal.snapshot.raw.scale.get()
		: out.gesture.raw.scale;
	handoff.raw.normScale = useHandoffSnapshot
		? s.gesture.internal.snapshot.raw.normScale.get()
		: out.gesture.raw.normScale;
	handoff.raw.rotation = useHandoffSnapshot
		? s.gesture.internal.snapshot.raw.rotation.get()
		: out.gesture.raw.rotation;
	handoff.active = useHandoffSnapshot
		? s.gesture.internal.snapshot.active.get()
		: out.gesture.active;
	handoff.direction = useHandoffSnapshot
		? s.gesture.internal.snapshot.direction.get()
		: out.gesture.direction;
	out.progress = resolveGestureAffectedProgress(
		transitionProgress,
		out.gesture,
		{
			x: s.gesture.internal.progressDeltaX.get(),
			y: s.gesture.internal.progressDeltaY.get(),
		},
		effectiveOptions?.gestureDirection ?? s.options.gestureDirection,
		getResolvedSnapBounds(
			s.sortedNumericSnapPoints,
			s.hasAutoSnapPoint ? s.resolvedAutoSnapPoint.get() : null,
			canDismiss,
		),
	);

	// Unsure where else to place this if im being honest.
	// I think for here is fine
	if (s.visualProgress.get() !== out.progress) {
		s.visualProgress.set(out.progress);
	}

	const hasResidualGestureValues =
		Math.abs(out.gesture.normX) > EPSILON ||
		Math.abs(out.gesture.normY) > EPSILON ||
		Math.abs(out.gesture.normScale) > EPSILON ||
		Math.abs(out.gesture.rotation) > EPSILON;

	const isGestureActive =
		out.gesture.dragging ||
		out.gesture.settling ||
		(!out.gesture.dismissing && hasResidualGestureValues)
			? 1
			: 0;

	const isProgressAnimating = s.progressAnimating.get();

	out.animating = isProgressAnimating || isGestureActive ? 1 : 0;

	out.gesture.normalizedX = out.gesture.normX;
	out.gesture.normalizedY = out.gesture.normY;
	out.gesture.isDismissing = out.gesture.dismissing;
	out.gesture.isDragging = out.gesture.dragging;

	out.settled = s.progressSettled.get() && !isGestureActive ? 1 : 0;
	out.logicallySettled = out.settled;

	out.meta = s.meta;
	out.options = options;
	out.route = s.route;
	out.layouts.screen.width = dimensions.width;
	out.layouts.screen.height = dimensions.height;

	const content = s.measuredContentLayout.get();

	if (content) {
		s.contentLayoutSlot.width = content.width;
		s.contentLayoutSlot.height = content.height;
		out.layouts.content = s.contentLayoutSlot;
	} else {
		out.layouts.content = undefined;
	}

	out.layouts.scroll = s.scrollMetadata.get() ?? undefined;

	const autoSnapPoint = s.resolvedAutoSnapPoint.get();
	const resolvedAutoSnap =
		s.hasAutoSnapPoint && autoSnapPoint > 0 ? autoSnapPoint : null;

	out.animatedSnapIndex = computeAnimatedSnapIndex(
		out.progress,
		s.sortedNumericSnapPoints,
		resolvedAutoSnap,
	);

	const targetProgress = s.targetProgress.get();

	out.snapIndex = computeTargetSnapIndex(
		targetProgress,
		s.sortedNumericSnapPoints,
		resolvedAutoSnap,
	);

	return out;
};
