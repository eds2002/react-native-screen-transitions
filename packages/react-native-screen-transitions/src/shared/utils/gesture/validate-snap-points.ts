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
	if (!snapPoints) {
		return {
			hasSnapPoints: false,
			snapPoints: [],
			minSnapPoint: -1,
			maxSnapPoint: -1,
		};
	}

	const sortedSnaps = snapPoints.slice().sort((a, b) => a - b);
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
