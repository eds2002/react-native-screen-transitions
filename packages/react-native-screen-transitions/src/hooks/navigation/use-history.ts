import { useMemo, useSyncExternalStore } from "react";
import { type HistoryEntry, HistoryStore } from "../../stores/history.store";
import type { ScreenKey } from "../../types/screen.types";

interface UseHistoryReturn {
	/**
	 * The full history map.
	 */
	history: ReadonlyMap<ScreenKey, HistoryEntry>;

	/**
	 * Get N most recent history entries.
	 * Most recent first.
	 */
	getRecent: (n: number) => HistoryEntry[];

	/**
	 * Get history entries for a specific navigator.
	 * Most recent first.
	 */
	getByNavigator: (navigatorKey: string) => HistoryEntry[];

	/**
	 * Get the path between two screens (for multi-waypoint interpolation).
	 * Returns screen keys in order from 'from' to 'to'.
	 */
	getPath: (fromKey: ScreenKey, toKey: ScreenKey) => ScreenKey[];

	/**
	 * Get a specific history entry by screen key.
	 */
	get: (screenKey: ScreenKey) => HistoryEntry | undefined;

	/**
	 * Get the most recent history entry (for forward navigation).
	 */
	getMostRecent: () => HistoryEntry | undefined;
}

/**
 * Subscribe to history store changes.
 * Returns the full history map and helper methods.
 */
export function useHistory(): UseHistoryReturn {
	const history = useSyncExternalStore(
		HistoryStore.subscribe,
		HistoryStore.getSnapshot,
	);

	return useMemo(
		() => ({
			history,
			getRecent: (n: number) => HistoryStore.getRecent(n),
			getByNavigator: (navigatorKey: string) =>
				HistoryStore.getByNavigator(navigatorKey),
			getPath: (fromKey: ScreenKey, toKey: ScreenKey) =>
				HistoryStore.getPath(fromKey, toKey),
			get: (screenKey: ScreenKey) => HistoryStore.get(screenKey),
			getMostRecent: () => HistoryStore.getMostRecent(),
		}),
		[history],
	);
}
