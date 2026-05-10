import type { SharedValue } from "react-native-reanimated";
import {
	ANIMATION_SNAP_THRESHOLD,
	EPSILON,
	FALSE,
	TRUE,
} from "../../../../constants";
import type { GestureStoreMap } from "../../../../stores/gesture.store";
import type {
	ScreenTransitionOptions,
	ScreenTransitionState,
} from "../../../../types/animation.types";
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
	options: ScreenTransitionOptions;
	navigationMaskEnabled: boolean;
	targetProgress: SharedValue<number>;
	resolvedAutoSnapPoint: SharedValue<number>;
	measuredContentLayout: SharedValue<Layout | null>;
	contentLayoutSlot: Layout;
	hasAutoSnapPoint: boolean;
	sortedNumericSnapPoints: number[];
	unwrapped: ScreenTransitionState;
};

interface ComputeLogicallySettledParams {
	progress: number;
	targetProgress: number;
	settled: number;
	gestureActive: number;
}

const computeSettled = (
	animating: number,
	dismissing: number,
	closing: number,
) => {
	"worklet";
	return animating || dismissing || closing ? FALSE : TRUE;
};

const getResolvedSnapPointCount = (
	snapPoints: number[],
	resolvedAutoSnap: number | null,
) => {
	"worklet";
	return snapPoints.length + (resolvedAutoSnap !== null ? 1 : 0);
};

const getAutoSnapPointIndex = (
	snapPoints: number[],
	resolvedAutoSnap: number,
) => {
	"worklet";
	let index = 0;

	while (index < snapPoints.length && snapPoints[index] <= resolvedAutoSnap) {
		index++;
	}

	return index;
};

const getResolvedSnapPointAt = (
	snapPoints: number[],
	resolvedAutoSnap: number | null,
	autoSnapPointIndex: number,
	index: number,
) => {
	"worklet";
	if (resolvedAutoSnap === null) {
		return snapPoints[index];
	}

	if (index < autoSnapPointIndex) {
		return snapPoints[index];
	}

	if (index === autoSnapPointIndex) {
		return resolvedAutoSnap;
	}

	return snapPoints[index - 1];
};

const computeAnimatedSnapIndex = (
	progress: number,
	snapPoints: number[],
	resolvedAutoSnap: number | null,
): number => {
	"worklet";
	const snapPointCount = getResolvedSnapPointCount(
		snapPoints,
		resolvedAutoSnap,
	);

	if (snapPointCount === 0) return -1;

	const autoSnapPointIndex =
		resolvedAutoSnap === null
			? -1
			: getAutoSnapPointIndex(snapPoints, resolvedAutoSnap);
	const firstSnapPoint = getResolvedSnapPointAt(
		snapPoints,
		resolvedAutoSnap,
		autoSnapPointIndex,
		0,
	);
	const lastSnapPoint = getResolvedSnapPointAt(
		snapPoints,
		resolvedAutoSnap,
		autoSnapPointIndex,
		snapPointCount - 1,
	);

	if (progress <= firstSnapPoint) return 0;
	if (progress >= lastSnapPoint) return snapPointCount - 1;

	for (let i = 0; i < snapPointCount - 1; i++) {
		const currentSnapPoint = getResolvedSnapPointAt(
			snapPoints,
			resolvedAutoSnap,
			autoSnapPointIndex,
			i,
		);
		const nextSnapPoint = getResolvedSnapPointAt(
			snapPoints,
			resolvedAutoSnap,
			autoSnapPointIndex,
			i + 1,
		);

		if (progress <= nextSnapPoint) {
			const t =
				(progress - currentSnapPoint) / (nextSnapPoint - currentSnapPoint);
			return i + t;
		}
	}
	return snapPointCount - 1;
};

const computeTargetSnapIndex = (
	targetProgress: number,
	snapPoints: number[],
	resolvedAutoSnap: number | null,
): number => {
	"worklet";
	const snapPointCount = getResolvedSnapPointCount(
		snapPoints,
		resolvedAutoSnap,
	);

	if (snapPointCount === 0) return -1;

	const autoSnapPointIndex =
		resolvedAutoSnap === null
			? -1
			: getAutoSnapPointIndex(snapPoints, resolvedAutoSnap);
	const firstSnapPoint = getResolvedSnapPointAt(
		snapPoints,
		resolvedAutoSnap,
		autoSnapPointIndex,
		0,
	);

	if (targetProgress <= 0 && Math.abs(firstSnapPoint) > EPSILON) {
		return -1;
	}

	let nearestIndex = 0;
	let smallestDistance = Math.abs(targetProgress - firstSnapPoint);

	for (let i = 1; i < snapPointCount; i++) {
		const snapPoint = getResolvedSnapPointAt(
			snapPoints,
			resolvedAutoSnap,
			autoSnapPointIndex,
			i,
		);
		const distance = Math.abs(targetProgress - snapPoint);

		if (distance < smallestDistance) {
			smallestDistance = distance;
			nearestIndex = i;
		}
	}

	return nearestIndex;
};

const computeLogicallySettledValue = (
	progress: number,
	targetProgress: number,
	settled: number,
	gestureActive: number,
) => {
	"worklet";

	if (settled) {
		return TRUE;
	}

	if (gestureActive) {
		return FALSE;
	}

	return Math.abs(progress - targetProgress) <= ANIMATION_SNAP_THRESHOLD
		? TRUE
		: FALSE;
};

export const computeLogicallySettled = (
	params: ComputeLogicallySettledParams,
) => {
	"worklet";
	return computeLogicallySettledValue(
		params.progress,
		params.targetProgress,
		params.settled,
		params.gestureActive,
	);
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
	out.gesture.settling = s.gesture.settling.get();
	out.gesture.active = s.gesture.active.get();
	out.gesture.direction = s.gesture.direction.get();

	const isGestureSettling =
		Math.abs(out.gesture.normX) > EPSILON ||
		Math.abs(out.gesture.normY) > EPSILON ||
		Math.abs(out.gesture.normScale) > EPSILON;
	const isGestureActive =
		out.gesture.dragging || out.gesture.settling || isGestureSettling
			? TRUE
			: FALSE;

	out.animating = s.animating.get() || isGestureActive ? 1 : 0;

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
	out.logicallySettled = computeLogicallySettledValue(
		out.progress,
		targetProgress,
		out.settled,
		isGestureActive,
	);

	if (s.settled.get() !== out.settled) {
		s.settled.set(out.settled);
	}

	if (s.logicallySettled.get() !== out.logicallySettled) {
		s.logicallySettled.set(out.logicallySettled);
	}

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
