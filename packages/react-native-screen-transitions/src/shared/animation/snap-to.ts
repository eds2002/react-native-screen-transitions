import { runOnUI } from "react-native-reanimated";
import { DefaultSnapSpec } from "../configs/specs";
import { AnimationStore } from "../stores/animation.store";
import type { HistoryEntry } from "../stores/history.store";
import { animateToProgress } from "../utils/animation/animate-to-progress";
import { logger } from "../utils/logger";
import { resolveSnapTargetEntry } from "./resolve-snap-target";

const getSortedSnapPoints = (
	descriptor: HistoryEntry["descriptor"],
): number[] | null => {
	const snapPoints = descriptor.options?.snapPoints;
	if (!snapPoints || snapPoints.length === 0) return null;
	return [...snapPoints].sort((a, b) => a - b);
};

export function snapDescriptorToIndex(
	descriptor: HistoryEntry["descriptor"],
	index: number,
): boolean {
	const sorted = getSortedSnapPoints(descriptor);
	if (!sorted) {
		logger.warn("snapTo: target screen has no snapPoints");
		return false;
	}

	if (index < 0 || index >= sorted.length) {
		logger.warn(
			`snapTo: index ${index} out of bounds (0-${sorted.length - 1})`,
		);
		return false;
	}

	const targetProgress = sorted[index];
	const animations = AnimationStore.getRouteAnimations(descriptor.route.key);

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

	return true;
}

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
	const screenWithSnapPoints = resolveSnapTargetEntry();

	if (!screenWithSnapPoints) {
		logger.warn("snapTo: No screens with snapPoints in history");
		return;
	}

	snapDescriptorToIndex(screenWithSnapPoints.descriptor, index);
}
