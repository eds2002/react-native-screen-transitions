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

export const resolveRuntimeSnapPoints = ({
	snapPoints,
	hasAutoSnapPoint,
	resolvedAutoSnapPoint,
	minSnapPoint,
	maxSnapPoint,
	canDismiss,
}: ResolveRuntimeSnapPointsProps): ResolvedRuntimeSnapPointsResult => {
	"worklet";

	const nextResolvedAutoSnapPoint =
		hasAutoSnapPoint && resolvedAutoSnapPoint > 0
			? resolvedAutoSnapPoint
			: null;

	const resolvedSnapPoints =
		nextResolvedAutoSnapPoint === null
			? snapPoints
			: [...snapPoints, nextResolvedAutoSnapPoint].sort((a, b) => a - b);

	const resolvedMinSnapPoint =
		nextResolvedAutoSnapPoint !== null && !canDismiss
			? Math.min(
					minSnapPoint === -1 ? nextResolvedAutoSnapPoint : minSnapPoint,
					nextResolvedAutoSnapPoint,
				)
			: minSnapPoint;

	return {
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
