import type { BaseStackScene } from "../../../types/stack.types";

type StackScene = BaseStackScene;

export type FloatOverlayEntry = {
	scene: StackScene;
	overlayIndex: number;
};

export type FloatOverlayTransitionEntry = FloatOverlayEntry & {
	driverScene: StackScene;
};

/**
 * Overlay ordering and transition coordination are library-owned. Visibility,
 * interaction, and presentation are user-owned.
 */
export function getFloatOverlayStack(
	scenes: StackScene[],
	transitionsAlwaysOn: boolean,
): FloatOverlayEntry[] {
	const candidates: FloatOverlayEntry[] = [];

	for (let index = 0; index < scenes.length; index += 1) {
		const scene = scenes[index];
		const options = scene?.descriptor?.options;

		if (!transitionsAlwaysOn && !options?.enableTransitions) {
			continue;
		}

		if (options?.overlay && options?.overlayShown !== false) {
			candidates.push({ scene, overlayIndex: index });
		}
	}

	return candidates;
}

export function getFloatOverlayTransitions(
	overlayStack: FloatOverlayEntry[],
	scenes: StackScene[],
): FloatOverlayTransitionEntry[] {
	const topScene = scenes[scenes.length - 1];

	return overlayStack.map((entry, index) => {
		const nextEntry = overlayStack[index + 1];
		let nextPresentedEntry: FloatOverlayEntry | undefined;

		for (
			let nextIndex = index + 1;
			nextIndex < overlayStack.length;
			nextIndex++
		) {
			const candidate = overlayStack[nextIndex];
			if (candidate?.scene.activity !== "closing") {
				nextPresentedEntry = candidate;
				break;
			}
		}

		const driverScene =
			entry.scene.activity === "closing" && nextEntry
				? entry.scene
				: (nextPresentedEntry?.scene ??
					nextEntry?.scene ??
					topScene ??
					entry.scene);

		return {
			...entry,
			driverScene,
		};
	});
}
