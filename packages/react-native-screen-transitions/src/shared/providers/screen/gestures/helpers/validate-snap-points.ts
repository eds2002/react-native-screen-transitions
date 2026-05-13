import type { SnapPoint } from "../../../../types/screen.types";

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
		if (typeof point !== "number" || !Number.isFinite(point)) {
			continue;
		}

		if (!canDismiss && point <= 0) {
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

interface ValidateSnapPointsOptions {
	snapPoints?: SnapPoint[];
	canDismiss?: boolean;
}

export const validateSnapPoints = ({
	snapPoints,
	canDismiss,
}: ValidateSnapPointsOptions): EffectiveSnapPointsResult => {
	if (!snapPoints || snapPoints.length === 0) {
		return {
			hasSnapPoints: false,
			hasAutoSnapPoint: false,
			snapPoints: [],
			minSnapPoint: -1,
			maxSnapPoint: -1,
		};
	}

	const hasAuto = snapPoints.includes("auto");
	const normalizedSnaps = sanitizeSnapPoints(snapPoints, canDismiss ?? false);

	// hasSnapPoints is true if there are valid numeric points OR an 'auto' point
	if (normalizedSnaps.length === 0 && !hasAuto) {
		return {
			hasSnapPoints: false,
			hasAutoSnapPoint: false,
			snapPoints: [],
			minSnapPoint: -1,
			maxSnapPoint: -1,
		};
	}

	const sortedSnaps = normalizedSnaps.slice().sort((a, b) => a - b);
	// Clamp to snap point bounds (dismiss at 0 only if allowed)
	const minProgress = canDismiss ? 0 : (sortedSnaps[0] ?? -1);
	const maxProgress = sortedSnaps[sortedSnaps.length - 1] ?? -1;

	return {
		hasSnapPoints: true,
		hasAutoSnapPoint: hasAuto,
		snapPoints: sortedSnaps,
		minSnapPoint: minProgress,
		maxSnapPoint: maxProgress,
	};
};
