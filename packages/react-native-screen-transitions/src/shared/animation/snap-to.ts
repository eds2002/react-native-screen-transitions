import { runOnUI } from "react-native-reanimated";
import { DefaultSnapSpec } from "../configs/specs";
import { AnimationStore } from "../stores/animation.store";
import { HistoryStore } from "../stores/history.store";
import { animateToProgress } from "../utils/animation/animate-to-progress";

/**
 * Programmatically snap the currently focused screen to a specific snap point.
 *
 * @param index - The index of the snap point to snap to (0-based, sorted ascending)
 *
 * @example
 * ```tsx
 * import { snapTo } from 'react-native-screen-transitions';
 *
 * // Snap to the first (smallest) snap point
 * snapTo(0);
 *
 * // Snap to the last (largest) snap point
 * snapTo(2); // if there are 3 snap points
 * ```
 */
export function snapTo(index: number): void {
	const recent = HistoryStore.getMostRecent();

	if (!recent) {
		console.warn("snapTo: No screen in history");
		return;
	}

	const { descriptor } = recent;
	const snapPoints = descriptor.options?.snapPoints;

	if (!snapPoints || snapPoints.length === 0) {
		console.warn("snapTo: No snapPoints defined on current screen");
		return;
	}

	const sorted = [...snapPoints].sort((a, b) => a - b);

	if (index < 0 || index >= sorted.length) {
		console.warn(
			`snapTo: index ${index} out of bounds (0-${sorted.length - 1})`,
		);
		return;
	}

	const targetProgress = sorted[index];
	const animations = AnimationStore.getAll(descriptor.route.key);

	runOnUI(() => {
		"worklet";
		animateToProgress({
			target: targetProgress,
			animations,
			spec: {
				open: descriptor.options.transitionSpec?.expand ?? DefaultSnapSpec,
				close: descriptor.options.transitionSpec?.collapse ?? DefaultSnapSpec,
			},
		});
	})();
}
