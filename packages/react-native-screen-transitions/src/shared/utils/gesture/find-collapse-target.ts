import { EPSILON } from "../../constants";

interface FindCollapseTargetResult {
	target: number;
	shouldDismiss: boolean;
}

/**
 * Finds the next lower snap point for backdrop collapse behavior.
 *
 * - If above min snap: returns next lower snap point
 * - If at or below min snap: returns 0 (dismiss) if canDismiss, else stays at min
 *
 * @param currentProgress - Current animation progress
 * @param snapPoints - Array of snap points
 * @param canDismiss - Whether dismissing is allowed
 */
export function findCollapseTarget(
	currentProgress: number,
	snapPoints: number[],
	canDismiss: boolean,
): FindCollapseTargetResult {
	"worklet";

	const normalized = snapPoints.filter((point) =>
		canDismiss ? Number.isFinite(point) : Number.isFinite(point) && point > 0,
	);

	if (normalized.length === 0) {
		return canDismiss
			? { target: 0, shouldDismiss: true }
			: { target: currentProgress, shouldDismiss: false };
	}

	const sorted = [...normalized].sort((a, b) => a - b);
	const minSnap = sorted[0];

	// Find next lower snap point
	for (let i = sorted.length - 1; i >= 0; i--) {
		if (sorted[i] < currentProgress - EPSILON) {
			return { target: sorted[i], shouldDismiss: false };
		}
	}

	// At or below min snap → dismiss if allowed
	if (canDismiss) {
		return { target: 0, shouldDismiss: true };
	}

	// Can't dismiss, stay at min
	return { target: minSnap, shouldDismiss: false };
}
