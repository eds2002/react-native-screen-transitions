interface ValidateSnapPointsResult {
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

	const normalizedSnaps = snapPoints.filter((point) =>
		canDismiss ? Number.isFinite(point) : Number.isFinite(point) && point > 0,
	);

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
