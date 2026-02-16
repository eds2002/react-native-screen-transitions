/**
 * Filters snap points to only valid, finite values.
 * Excludes zero (dismiss) when canDismiss is false.
 */
export function sanitizeSnapPoints(
	snapPoints: number[],
	canDismiss: boolean,
): number[] {
	"worklet";
	return snapPoints.filter((point) =>
		canDismiss ? Number.isFinite(point) : Number.isFinite(point) && point > 0,
	);
}

export interface ValidateSnapPointsResult {
	hasSnapPoints: boolean;
	snapPoints: number[];
	minSnapPoint: number;
	maxSnapPoint: number;
}

interface ValidateSnapPointsOptions {
	snapPoints?: number[];
	canDismiss?: boolean;
}

export const validateSnapPoints = ({
	snapPoints,
	canDismiss,
}: ValidateSnapPointsOptions): ValidateSnapPointsResult => {
	if (!snapPoints || snapPoints.length === 0) {
		return {
			hasSnapPoints: false,
			snapPoints: [],
			minSnapPoint: -1,
			maxSnapPoint: -1,
		};
	}

	const normalizedSnaps = sanitizeSnapPoints(snapPoints, canDismiss ?? false);

	if (normalizedSnaps.length === 0) {
		return {
			hasSnapPoints: false,
			snapPoints: [],
			minSnapPoint: -1,
			maxSnapPoint: -1,
		};
	}

	const sortedSnaps = normalizedSnaps.slice().sort((a, b) => a - b);
	// Clamp to snap point bounds (dismiss at 0 only if allowed)
	const minProgress = canDismiss ? 0 : sortedSnaps[0];
	const maxProgress = sortedSnaps[sortedSnaps.length - 1];

	return {
		hasSnapPoints: true,
		snapPoints: sortedSnaps,
		minSnapPoint: minProgress,
		maxSnapPoint: maxProgress,
	};
};
