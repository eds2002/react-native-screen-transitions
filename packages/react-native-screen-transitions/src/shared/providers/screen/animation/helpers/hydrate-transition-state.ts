import type { SharedValue } from "react-native-reanimated";
import {
	ANIMATION_SNAP_THRESHOLD,
	EPSILON,
	FALSE,
	TRUE,
} from "../../../../constants";
import type { GestureStoreMap } from "../../../../stores/gesture.store";
import type { ScreenTransitionState } from "../../../../types/animation.types";
import type { Layout } from "../../../../types/screen.types";
import type { BaseStackRoute } from "../../../../types/stack.types";

type BuiltState = {
	progress: SharedValue<number>;
	willAnimate: SharedValue<number>;
	closing: SharedValue<number>;
	animating: SharedValue<number>;
	entering: SharedValue<number>;
	settled: SharedValue<number>;
	logicallySettled: SharedValue<number>;
	gesture: GestureStoreMap;
	route: BaseStackRoute;
	meta?: Record<string, unknown>;
	targetProgress: SharedValue<number>;
	resolvedAutoSnapPoint: SharedValue<number>;
	measuredContentLayout: SharedValue<Layout | null>;
	hasAutoSnapPoint: boolean;
	sortedNumericSnapPoints: number[];
	unwrapped: ScreenTransitionState;
};

interface ComputeLogicallySettledParams {
	progress: number;
	targetProgress: number;
	settled: number;
	dragging: number;
}

const computeSettled = (params: {
	animating: number;
	dismissing: number;
	closing: number;
}) => {
	"worklet";
	const { animating, dismissing, closing } = params;
	return animating || dismissing || closing ? FALSE : TRUE;
};

const computeAnimatedSnapIndex = (
	progress: number,
	snapPoints: number[],
): number => {
	"worklet";
	if (snapPoints.length === 0) return -1;
	if (progress <= snapPoints[0]) return 0;
	if (progress >= snapPoints[snapPoints.length - 1])
		return snapPoints.length - 1;

	for (let i = 0; i < snapPoints.length - 1; i++) {
		if (progress <= snapPoints[i + 1]) {
			const t =
				(progress - snapPoints[i]) / (snapPoints[i + 1] - snapPoints[i]);
			return i + t;
		}
	}
	return snapPoints.length - 1;
};

const computeTargetSnapIndex = (
	targetProgress: number,
	snapPoints: number[],
): number => {
	"worklet";
	if (snapPoints.length === 0) return -1;

	if (targetProgress <= 0 && Math.abs(snapPoints[0]) > EPSILON) {
		return -1;
	}

	let nearestIndex = 0;
	let smallestDistance = Math.abs(targetProgress - snapPoints[0]);

	for (let i = 1; i < snapPoints.length; i++) {
		const distance = Math.abs(targetProgress - snapPoints[i]);

		if (distance < smallestDistance) {
			smallestDistance = distance;
			nearestIndex = i;
		}
	}

	return nearestIndex;
};

export const computeLogicallySettled = ({
	progress,
	targetProgress,
	settled,
	dragging,
}: ComputeLogicallySettledParams) => {
	"worklet";

	if (settled) {
		return TRUE;
	}

	if (dragging) {
		return FALSE;
	}

	return Math.abs(progress - targetProgress) <= ANIMATION_SNAP_THRESHOLD
		? TRUE
		: FALSE;
};

export const hydrateTransitionState = (
	s: BuiltState,
	dimensions: Layout,
): ScreenTransitionState => {
	"worklet";
	const out = s.unwrapped;
	out.progress = s.progress.get();
	out.willAnimate = s.willAnimate.get();
	out.closing = s.closing.get();
	out.entering = s.entering.get();
	out.gesture.x = s.gesture.x.get();
	out.gesture.y = s.gesture.y.get();
	out.gesture.normX = s.gesture.normX.get();
	out.gesture.normY = s.gesture.normY.get();
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
	out.gesture.direction = s.gesture.direction.get();

	const isGestureSettling =
		Math.abs(out.gesture.normX) > EPSILON ||
		Math.abs(out.gesture.normY) > EPSILON ||
		Math.abs(out.gesture.normScale) > EPSILON;

	out.animating =
		s.animating.get() || out.gesture.dragging || isGestureSettling ? 1 : 0;

	out.gesture.normalizedX = out.gesture.normX;
	out.gesture.normalizedY = out.gesture.normY;
	out.gesture.isDismissing = out.gesture.dismissing;
	out.gesture.isDragging = out.gesture.dragging;

	out.settled = computeSettled({
		animating: out.animating,
		dismissing: out.gesture.dismissing,
		closing: out.closing,
	});
	out.logicallySettled = computeLogicallySettled({
		progress: out.progress,
		targetProgress: s.targetProgress.get(),
		settled: out.settled,
		dragging: out.gesture.dragging,
	});

	if (s.settled.get() !== out.settled) {
		s.settled.set(out.settled);
	}

	if (s.logicallySettled.get() !== out.logicallySettled) {
		s.logicallySettled.set(out.logicallySettled);
	}

	out.meta = s.meta;
	out.layouts.screen.width = dimensions.width;
	out.layouts.screen.height = dimensions.height;

	const content = s.measuredContentLayout.get();
	if (content) {
		if (!out.layouts.content) {
			out.layouts.content = {
				width: content.width,
				height: content.height,
			};
		} else {
			out.layouts.content.width = content.width;
			out.layouts.content.height = content.height;
		}
	} else {
		out.layouts.content = undefined;
	}

	const resolvedAutoSnap =
		s.hasAutoSnapPoint && s.resolvedAutoSnapPoint.get() > 0
			? s.resolvedAutoSnapPoint.get()
			: null;

	const resolvedSnapPoints =
		resolvedAutoSnap !== null
			? [...s.sortedNumericSnapPoints, resolvedAutoSnap].sort((a, b) => a - b)
			: s.sortedNumericSnapPoints;

	out.animatedSnapIndex = computeAnimatedSnapIndex(
		out.progress,
		resolvedSnapPoints,
	);
	out.snapIndex = computeTargetSnapIndex(
		s.targetProgress.get(),
		resolvedSnapPoints,
	);

	return out;
};
