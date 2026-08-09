import type { StackScene } from "../../../hooks/navigation/use-stack";
import { isOverlayVisible } from "../../../utils/overlay/visibility";

export type FloatOverlayActivity = "active" | "inert" | "inactive" | "closing";

export type FloatOverlayEntry = {
	scene: StackScene;
	overlayIndex: number;
	activity: FloatOverlayActivity;
};

export type FloatOverlayTransitionEntry = FloatOverlayEntry & {
	driverScene: StackScene;
};

type OverlayCandidate = Omit<FloatOverlayEntry, "activity">;

const resolveOverlayActivity = (
	scene: StackScene,
	distanceFromTop: number,
): FloatOverlayActivity => {
	if (distanceFromTop === 0 && scene.activity === "closing") {
		return "closing";
	}

	if (distanceFromTop === 0) {
		return "active";
	}

	if (distanceFromTop === 1) {
		return "inert";
	}

	return "inactive";
};

/**
 * Finds every visible floating-overlay checkpoint in stack order.
 *
 * The newest checkpoint owns the active overlay. Its immediate predecessor
 * remains visible and inert; all older checkpoints are retained but inactive.
 * This mirrors the screen activity window without making plain screens create
 * a new overlay checkpoint.
 */
export function getFloatOverlayStack(
	scenes: StackScene[],
	transitionsAlwaysOn: boolean,
): FloatOverlayEntry[] {
	const candidates: OverlayCandidate[] = [];

	for (let index = 0; index < scenes.length; index += 1) {
		const scene = scenes[index];
		const options = scene?.descriptor?.options;

		if (!transitionsAlwaysOn && !options?.enableTransitions) {
			continue;
		}

		if (isOverlayVisible(options)) {
			candidates.push({ scene, overlayIndex: index });
		}
	}

	const topIndex = candidates.length - 1;
	return candidates.map((candidate, index) => ({
		...candidate,
		activity: resolveOverlayActivity(candidate.scene, topIndex - index),
	}));
}

export function getFloatOverlayTransitions(
	overlayStack: FloatOverlayEntry[],
	scenes: StackScene[],
): FloatOverlayTransitionEntry[] {
	const topScene = scenes[scenes.length - 1];

	return overlayStack.map((entry, index) => ({
		...entry,
		driverScene: overlayStack[index + 1]?.scene ?? topScene ?? entry.scene,
	}));
}
