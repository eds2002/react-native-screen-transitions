import {
	EPSILON,
	LOGICAL_SETTLE_PROGRESS_THRESHOLD,
	LOGICAL_SETTLE_REQUIRED_FRAMES,
} from "../../../../../constants";
import type { ScreenTransitionOptions } from "../../../../../types/animation.types";
import type { Layout } from "../../../../../types/screen.types";
import { resolveGestureDrivenProgress } from "./gesture-progress";
import {
	computeLogicallySettled,
	computeNextLogicalSettleFrameCount,
	computeSettled,
} from "./settle";
import {
	computeAnimatedSnapIndex,
	computeTargetSnapIndex,
	getResolvedSnapBounds,
} from "./snap-points";
import type { BuiltState } from "./types";

export { computeLogicallySettled } from "./settle";

const LOGICAL_SETTLE_STICKY_PROGRESS_THRESHOLD =
	LOGICAL_SETTLE_PROGRESS_THRESHOLD * 10;

export const hydrateTransitionState = (
	s: BuiltState,
	dimensions: Layout,
	effectiveOptions?: ScreenTransitionOptions,
) => {
	"worklet";
	const out = s.unwrapped;
	const baseProgress = s.progress.get();
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
	out.gesture.raw.x = s.gesture.raw.x.get();
	out.gesture.raw.y = s.gesture.raw.y.get();
	out.gesture.raw.normX = s.gesture.raw.normX.get();
	out.gesture.raw.normY = s.gesture.raw.normY.get();
	out.gesture.raw.scale = s.gesture.raw.scale.get();
	out.gesture.raw.normScale = s.gesture.raw.normScale.get();
	out.gesture.dismissing = s.gesture.dismissing.get();
	out.gesture.dragging = s.gesture.dragging.get();
	out.gesture.settling = s.gesture.settling.get();
	out.gesture.active = s.gesture.active.get();
	out.gesture.direction = s.gesture.direction.get();
	out.progress = resolveGestureDrivenProgress(
		baseProgress,
		out.gesture,
		s.options,
		effectiveOptions,
		getResolvedSnapBounds(
			s.sortedNumericSnapPoints,
			s.hasAutoSnapPoint ? s.resolvedAutoSnapPoint.get() : null,
		),
	);

	const hasResidualGestureValues =
		Math.abs(out.gesture.normX) > EPSILON ||
		Math.abs(out.gesture.normY) > EPSILON ||
		Math.abs(out.gesture.normScale) > EPSILON;

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

	out.settled = computeSettled(
		out.animating,
		out.gesture.dismissing,
		out.closing,
	);
	const targetProgress = s.targetProgress.get();
	const logicalSettleFrameCount = s.logicalSettleFrameCount.get();
	const nextLogicalSettleFrameCount = computeNextLogicalSettleFrameCount({
		progress: out.progress,
		targetProgress,
		frameCount: logicalSettleFrameCount,
	});

	if (nextLogicalSettleFrameCount !== logicalSettleFrameCount) {
		s.logicalSettleFrameCount.set(nextLogicalSettleFrameCount);
	}

	const progressDistanceFromTarget = Math.abs(out.progress - targetProgress);
	const computedLogicallySettled =
		computeLogicallySettled({
			progress: out.progress,
			targetProgress,
			frameCount: nextLogicalSettleFrameCount,
		}) && !isGestureActive;

	const wasLogicallySettled =
		out.logicallySettled &&
		logicalSettleFrameCount >= LOGICAL_SETTLE_REQUIRED_FRAMES;

	const shouldPreserveLogicalSettle =
		wasLogicallySettled &&
		!isProgressAnimating &&
		!isGestureActive &&
		progressDistanceFromTarget <= LOGICAL_SETTLE_STICKY_PROGRESS_THRESHOLD;

	out.logicallySettled =
		computedLogicallySettled || shouldPreserveLogicalSettle ? 1 : 0;

	out.meta = s.meta;
	out.options = s.options;
	out.route = s.route;
	out.layouts.screen.width = dimensions.width;
	out.layouts.screen.height = dimensions.height;
	out.layouts.navigationMaskEnabled = s.navigationMaskEnabled;

	const content = s.measuredContentLayout.get();

	if (content) {
		s.contentLayoutSlot.width = content.width;
		s.contentLayoutSlot.height = content.height;
		out.layouts.content = s.contentLayoutSlot;
	} else {
		out.layouts.content = undefined;
	}

	const autoSnapPoint = s.resolvedAutoSnapPoint.get();
	const resolvedAutoSnap =
		s.hasAutoSnapPoint && autoSnapPoint > 0 ? autoSnapPoint : null;

	out.animatedSnapIndex = computeAnimatedSnapIndex(
		out.progress,
		s.sortedNumericSnapPoints,
		resolvedAutoSnap,
	);

	out.snapIndex = computeTargetSnapIndex(
		targetProgress,
		s.sortedNumericSnapPoints,
		resolvedAutoSnap,
	);

	return out;
};
