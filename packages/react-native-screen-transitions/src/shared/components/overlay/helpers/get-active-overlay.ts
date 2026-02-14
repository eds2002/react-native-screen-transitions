import type { StackScene } from "../../../hooks/navigation/use-stack";
import { isFloatOverlayVisible } from "../../../utils/overlay/visibility";

/**
 * Find the active float overlay from scenes.
 * Scans from the top of the stack downward to find the first screen
 * with a visible overlay that isn't explicitly set to legacy screen mode.
 */
export function getActiveFloatOverlay(
	scenes: StackScene[],
	index: number,
	transitionsAlwaysOn: boolean,
): { scene: StackScene; overlayIndex: number } | null {
	if (scenes.length === 0) {
		return null;
	}

	// When navigating back, closing scenes are kept at the top of the local stack
	// while the focused index already points to the destination screen. We need to
	// start scanning from the actual top of the stack so the overlay can animate
	// out together with its closing screen instead of disappearing immediately.
	const startIndex = Math.max(index, scenes.length - 1);

	for (let i = startIndex; i >= 0; i--) {
		const scene = scenes[i];
		const options = scene?.descriptor?.options;

		// Skip screens without enableTransitions (native-stack only)
		if (!transitionsAlwaysOn && !options?.enableTransitions) {
			continue;
		}

		if (isFloatOverlayVisible(options)) {
			return { scene, overlayIndex: i };
		}
	}

	return null;
}
