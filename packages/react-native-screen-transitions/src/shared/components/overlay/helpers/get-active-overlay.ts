import type { StackScene } from "../../../hooks/navigation/use-stack";
import { isOverlayVisible } from "../../../utils/overlay/visibility";

export interface ActiveFloatOverlay {
	scene: StackScene;
	overlayIndex: number;
}

/**
 * Returns the top-most visible floating overlay.
 * Closing scenes remain in the local stack during dismiss animations, so we
 * scan from the actual top to keep their overlay alive until the transition
 * finishes.
 */
export function getActiveFloatOverlay(
	scenes: StackScene[],
	transitionsAlwaysOn: boolean,
): ActiveFloatOverlay | null {
	if (scenes.length === 0) {
		return null;
	}

	for (let i = scenes.length - 1; i >= 0; i--) {
		const scene = scenes[i];
		const options = scene.descriptor.options;

		// Skip screens without enableTransitions (native-stack only)
		if (!transitionsAlwaysOn && !options.enableTransitions) {
			continue;
		}

		if (isOverlayVisible(options)) {
			return { scene, overlayIndex: i };
		}
	}

	return null;
}
