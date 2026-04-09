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

/**
 * Computes the animated snap index based on progress and snap points.
 * Returns -1 if no snap points, otherwise interpolates between indices.
 */
const computeSnapIndex = (progress: number, snapPoints: number[]): number => {
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

/**
 * Determines whether the screen transition is logically settled.
 *
 * A transition is considered logically settled when:
 * - The `settled` flag is explicitly set, OR
 * - The screen is not being dragged AND the progress is within
 *   {@link ANIMATION_SNAP_THRESHOLD} of the target progress.
 */
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
	out.progress = s.progress.value;
	out.willAnimate = s.willAnimate.value;
	out.closing = s.closing.value;
	out.entering = s.entering.value;
	out.gesture.x = s.gesture.x.value;
	out.gesture.y = s.gesture.y.value;
	out.gesture.normX = s.gesture.normX.value;
	out.gesture.normY = s.gesture.normY.value;
	out.gesture.scale = s.gesture.scale.value;
	out.gesture.normScale = s.gesture.normScale.value;
	out.gesture.focalX = s.gesture.focalX.value;
	out.gesture.focalY = s.gesture.focalY.value;
	out.gesture.dismissing = s.gesture.dismissing.value;
	out.gesture.dragging = s.gesture.dragging.value;
	out.gesture.direction = s.gesture.direction.value;

	const isGestureSettling =
		Math.abs(out.gesture.normX) > EPSILON ||
		Math.abs(out.gesture.normY) > EPSILON ||
		Math.abs(out.gesture.normScale) > EPSILON;

	out.animating =
		s.animating.value || out.gesture.dragging || isGestureSettling ? 1 : 0;

	out.settled = computeSettled({
		animating: out.animating,
		dismissing: out.gesture.dismissing,
		closing: out.closing,
	});
	out.logicallySettled = computeLogicallySettled({
		progress: out.progress,
		targetProgress: s.targetProgress.value,
		settled: out.settled,
		dragging: out.gesture.dragging,
	});

	if (s.settled.value !== out.settled) {
		s.settled.value = out.settled;
	}

	if (s.logicallySettled.value !== out.logicallySettled) {
		s.logicallySettled.value = out.logicallySettled;
	}

	out.meta = s.meta;
	out.layouts.screen.width = dimensions.width;
	out.layouts.screen.height = dimensions.height;

	const content = s.measuredContentLayout.value;
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
		s.hasAutoSnapPoint && s.resolvedAutoSnapPoint.value > 0
			? s.resolvedAutoSnapPoint.value
			: null;

	const resolvedSnapPoints =
		resolvedAutoSnap !== null
			? [...s.sortedNumericSnapPoints, resolvedAutoSnap].sort((a, b) => a - b)
			: s.sortedNumericSnapPoints;

	out.snapIndex = computeSnapIndex(out.progress, resolvedSnapPoints);

	return out;
};
