import { HistoryStore } from "../stores/history.store";
import { SystemStore } from "../stores/system.store";
import type { ScreenKey } from "../types/screen.types";
import { logger } from "../utils/logger";

const resolveTransitionRouteKey = (
	routeKey: ScreenKey | undefined,
	actionName: "blockTransition" | "unblockTransition",
): ScreenKey | undefined => {
	if (routeKey !== undefined) {
		if (routeKey.length === 0) {
			logger.warn(`${actionName}: routeKey must not be empty`);
			return undefined;
		}

		return routeKey;
	}

	const entry = HistoryStore.getMostRecent();
	if (!entry) {
		logger.warn(`${actionName}: No screens in history`);
		return undefined;
	}

	return entry.descriptor.route.key;
};

/**
 * Prevents a screen's pending lifecycle transition from starting.
 *
 * Calls are reference-counted. Every call must be paired with one
 * {@linkcode unblockTransition} call for the same route. When `routeKey` is
 * omitted, the most recently focused screen in navigation history is used.
 *
 * @param routeKey - Route key of the screen to block.
 *
 * @example
 * ```tsx
 * blockTransition(route.key);
 * // Render or prepare the destination screen.
 * unblockTransition(route.key);
 * ```
 *
 * @see {@linkcode unblockTransition}
 */
export function blockTransition(routeKey?: ScreenKey): void {
	const resolvedRouteKey = resolveTransitionRouteKey(
		routeKey,
		"blockTransition",
	);
	if (!resolvedRouteKey) {
		return;
	}

	SystemStore.getBag(resolvedRouteKey).actions.blockLifecycleStart();
}

/**
 * Releases one lifecycle transition block for a screen.
 *
 * The pending transition can start when the screen's final block is released.
 * Extra calls are safe and leave the block count at zero. When `routeKey` is
 * omitted, the most recently focused screen in navigation history is used.
 *
 * @param routeKey - Route key of the screen to unblock.
 *
 * @see {@linkcode blockTransition}
 */
export function unblockTransition(routeKey?: ScreenKey): void {
	const resolvedRouteKey = resolveTransitionRouteKey(
		routeKey,
		"unblockTransition",
	);
	if (!resolvedRouteKey) {
		return;
	}

	SystemStore.getBag(resolvedRouteKey).actions.unblockLifecycleStart();
}
