import type { SnapPoint } from "../../../../types/screen.types";
import type { GesturePolicy, GestureRuntime } from "../types";

const createEmptySnapPoints = (): EffectiveSnapPointsResult => ({
	hasSnapPoints: false,
	hasAutoSnapPoint: false,
	snapPoints: [],
	minSnapPoint: -1,
	maxSnapPoint: -1,
});

const isNumericSnapPoint = (point: SnapPoint): point is number => {
	"worklet";
	return typeof point === "number" && Number.isFinite(point);
};

const canUseSnapPoint = (point: number, canDismiss: boolean) => {
	"worklet";
	return canDismiss || point > 0;
};

/**
 * Filters snap points to only valid, finite numeric values.
 * Excludes zero (dismiss) when canDismiss is false.
 */
export function sanitizeSnapPoints(
	snapPoints: SnapPoint[],
	canDismiss: boolean,
): number[] {
	"worklet";
	const normalized: number[] = [];

	for (let i = 0; i < snapPoints.length; i++) {
		const point = snapPoints[i];
		if (!isNumericSnapPoint(point) || !canUseSnapPoint(point, canDismiss)) {
			continue;
		}

		normalized.push(point);
	}

	return normalized;
}

export interface EffectiveSnapPointsResult {
	hasSnapPoints: boolean;
	hasAutoSnapPoint: boolean;
	snapPoints: number[];
	minSnapPoint: number;
	maxSnapPoint: number;
}

interface ResolveRuntimeSnapPointsProps {
	snapPoints: number[];
	hasAutoSnapPoint: boolean;
	resolvedAutoSnapPoint: number;
	minSnapPoint: number;
	maxSnapPoint: number;
	canDismiss: boolean;
}

interface ResolvedRuntimeSnapPointsResult {
	resolvedSnapPoints: number[];
	resolvedMinSnapPoint: number;
	resolvedMaxSnapPoint: number;
}

interface ValidateSnapPointsOptions {
	snapPoints?: SnapPoint[];
	canDismiss?: boolean;
}

const hasRuntimeSnapPoints = (snapPoints: SnapPoint[]) => {
	return snapPoints.length > 0;
};

const hasResolvedSnapPoints = (
	snapPoints: number[],
	hasAutoSnapPoint: boolean,
) => {
	return snapPoints.length > 0 || hasAutoSnapPoint;
};

const getMinSnapPoint = (snapPoints: number[], canDismiss?: boolean) => {
	return canDismiss ? 0 : (snapPoints[0] ?? -1);
};

const getMaxSnapPoint = (snapPoints: number[]) => {
	return snapPoints[snapPoints.length - 1] ?? -1;
};

const resolveAutoSnapPoint = (
	hasAutoSnapPoint: boolean,
	resolvedAutoSnapPoint: number,
) => {
	"worklet";
	return hasAutoSnapPoint && resolvedAutoSnapPoint > 0
		? resolvedAutoSnapPoint
		: null;
};

const addAutoSnapPoint = (
	snapPoints: number[],
	resolvedAutoSnapPoint: number | null,
) => {
	"worklet";
	return resolvedAutoSnapPoint === null
		? snapPoints
		: [...snapPoints, resolvedAutoSnapPoint].sort((a, b) => a - b);
};

const resolveMinSnapPoint = ({
	minSnapPoint,
	resolvedAutoSnapPoint,
	canDismiss,
}: {
	minSnapPoint: number;
	resolvedAutoSnapPoint: number | null;
	canDismiss: boolean;
}) => {
	"worklet";
	if (resolvedAutoSnapPoint === null || canDismiss) {
		return minSnapPoint;
	}

	return Math.min(
		minSnapPoint === -1 ? resolvedAutoSnapPoint : minSnapPoint,
		resolvedAutoSnapPoint,
	);
};

export const validateSnapPoints = ({
	snapPoints,
	canDismiss,
}: ValidateSnapPointsOptions): EffectiveSnapPointsResult => {
	if (!snapPoints || !hasRuntimeSnapPoints(snapPoints)) {
		return createEmptySnapPoints();
	}

	const hasAuto = snapPoints.includes("auto");
	const normalizedSnaps = sanitizeSnapPoints(snapPoints, canDismiss ?? false);

	if (!hasResolvedSnapPoints(normalizedSnaps, hasAuto)) {
		return createEmptySnapPoints();
	}

	const sortedSnaps = normalizedSnaps.slice().sort((a, b) => a - b);

	return {
		hasSnapPoints: true,
		hasAutoSnapPoint: hasAuto,
		snapPoints: sortedSnaps,
		minSnapPoint: getMinSnapPoint(sortedSnaps, canDismiss),
		maxSnapPoint: getMaxSnapPoint(sortedSnaps),
	};
};

export const resolveRuntimeSnapPoints = ({
	snapPoints,
	hasAutoSnapPoint,
	resolvedAutoSnapPoint,
	minSnapPoint,
	maxSnapPoint,
	canDismiss,
}: ResolveRuntimeSnapPointsProps): ResolvedRuntimeSnapPointsResult => {
	"worklet";

	const resolvedAuto = resolveAutoSnapPoint(
		hasAutoSnapPoint,
		resolvedAutoSnapPoint,
	);
	const resolvedSnapPoints = addAutoSnapPoint(snapPoints, resolvedAuto);

	return {
		resolvedSnapPoints,
		resolvedMinSnapPoint: resolveMinSnapPoint({
			minSnapPoint,
			resolvedAutoSnapPoint: resolvedAuto,
			canDismiss,
		}),
		resolvedMaxSnapPoint:
			resolvedSnapPoints[resolvedSnapPoints.length - 1] ?? maxSnapPoint,
	};
};

export const resolveRuntimeGestureSnapPoints = (
	runtime: GestureRuntime<GesturePolicy>,
): ResolvedRuntimeSnapPointsResult => {
	"worklet";
	const {
		participation,
		stores: { system },
	} = runtime;
	const { hasAutoSnapPoint, snapPoints, minSnapPoint, maxSnapPoint } =
		participation.effectiveSnapPoints;

	return resolveRuntimeSnapPoints({
		snapPoints,
		hasAutoSnapPoint,
		resolvedAutoSnapPoint: system.resolvedAutoSnapPoint.get(),
		minSnapPoint,
		maxSnapPoint,
		canDismiss: participation.canDismiss,
	});
};

const findNearestSnapPoint = (
	progress: number,
	snapPoints: number[],
): number => {
	"worklet";

	let nearest = snapPoints[0] ?? progress;
	let smallestDistance = Math.abs(progress - nearest);

	for (let i = 1; i < snapPoints.length; i++) {
		const point = snapPoints[i];
		const distance = Math.abs(progress - point);

		if (distance < smallestDistance) {
			smallestDistance = distance;
			nearest = point;
		}
	}

	return nearest;
};

export const primeRuntimeSnapPoint = (
	runtime: GestureRuntime<GesturePolicy>,
) => {
	"worklet";
	const {
		policy,
		stores: { animations },
		lockedSnapPoint,
	} = runtime;

	const { resolvedSnapPoints, resolvedMaxSnapPoint } =
		resolveRuntimeGestureSnapPoints(runtime);

	if (policy.gestureSnapLocked) {
		lockedSnapPoint.set(
			findNearestSnapPoint(animations.progress.get(), resolvedSnapPoints),
		);
		return;
	}

	lockedSnapPoint.set(resolvedMaxSnapPoint);
};
