interface ResolveRuntimeSnapPointsProps {
	snapPoints: number[];
	hasAutoSnapPoint: boolean;
	autoSnapPoint: number;
	minSnapPoint: number;
	maxSnapPoint: number;
	canDismiss: boolean;
}

interface ResolvedRuntimeSnapPointsResult {
	resolvedAutoSnapPoint: number | null;
	resolvedSnapPoints: number[];
	resolvedMinSnapPoint: number;
	resolvedMaxSnapPoint: number;
}

export const resolveRuntimeSnapPoints = ({
	snapPoints,
	hasAutoSnapPoint,
	autoSnapPoint,
	minSnapPoint,
	maxSnapPoint,
	canDismiss,
}: ResolveRuntimeSnapPointsProps): ResolvedRuntimeSnapPointsResult => {
	"worklet";

	const resolvedAutoSnapPoint =
		hasAutoSnapPoint && autoSnapPoint > 0 ? autoSnapPoint : null;

	const resolvedSnapPoints =
		resolvedAutoSnapPoint === null
			? snapPoints
			: [...snapPoints, resolvedAutoSnapPoint].sort((a, b) => a - b);

	const resolvedMinSnapPoint =
		resolvedAutoSnapPoint !== null && !canDismiss
			? Math.min(
					minSnapPoint === -1 ? resolvedAutoSnapPoint : minSnapPoint,
					resolvedAutoSnapPoint,
				)
			: minSnapPoint;

	return {
		resolvedAutoSnapPoint,
		resolvedSnapPoints,
		resolvedMinSnapPoint,
		resolvedMaxSnapPoint:
			resolvedSnapPoints[resolvedSnapPoints.length - 1] ?? maxSnapPoint,
	};
};

export const findNearestSnapPoint = (
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
