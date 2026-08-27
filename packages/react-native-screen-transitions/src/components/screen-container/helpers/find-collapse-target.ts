import { EPSILON } from "../../../constants";
import { sanitizeSnapPoints } from "../../../providers/screen/gestures/shared/snap-points";

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

	const normalized = sanitizeSnapPoints(snapPoints, canDismiss);

	if (normalized.length === 0) {
		return canDismiss
			? { target: 0, shouldDismiss: true }
			: { target: currentProgress, shouldDismiss: false };
	}

	let minSnap = normalized[0];
	let nextLowerSnap: number | null = null;

	for (let i = 0; i < normalized.length; i++) {
		const snap = normalized[i];
		if (snap < minSnap) {
			minSnap = snap;
		}

		if (
			snap < currentProgress - EPSILON &&
			(nextLowerSnap === null || snap > nextLowerSnap)
		) {
			nextLowerSnap = snap;
		}
	}

	if (nextLowerSnap !== null) {
		return { target: nextLowerSnap, shouldDismiss: false };
	}

	// At or below min snap → dismiss if allowed
	if (canDismiss) {
		return { target: 0, shouldDismiss: true };
	}

	// Can't dismiss, stay at min
	return { target: minSnap, shouldDismiss: false };
}
