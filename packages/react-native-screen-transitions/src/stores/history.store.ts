import type { ScreenKey } from "../types/screen.types";
import type { BaseStackDescriptor } from "../types/stack.types";

const HISTORY_LIMIT = 100;

interface HistoryEntry {
	descriptor: BaseStackDescriptor;
	navigatorKey: string;
	timestamp: number;
}

// Map preserves insertion order - index 0 = oldest, last = most recent
const history = new Map<ScreenKey, HistoryEntry>();
const listeners = new Set<() => void>();

// Cached snapshot for useSyncExternalStore
let cachedSnapshot: ReadonlyMap<ScreenKey, HistoryEntry> = history;

function updateSnapshot(): void {
	cachedSnapshot = new Map(history);
}

function notifyListeners(): void {
	updateSnapshot();
	listeners.forEach((listener) => {
		listener();
	});
}

/**
 * Subscribe for useSyncExternalStore compatibility
 */
function subscribe(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/**
 * Get current snapshot for useSyncExternalStore
 */
function getSnapshot(): ReadonlyMap<ScreenKey, HistoryEntry> {
	return cachedSnapshot;
}

/**
 * Add or move screen to top (most recent).
 * LRU behavior: if exists, delete and re-add to move to end.
 * @param descriptor - The screen descriptor
 * @param navigatorKey - The navigator's key (for cleanup on unmount)
 * @param historyKey - Optional custom key (defaults to navigatorKey:routeName)
 */
function focus(
	descriptor: BaseStackDescriptor,
	navigatorKey: string,
	historyKey?: ScreenKey,
): void {
	const key = historyKey ?? `${navigatorKey}:${descriptor.route.name}`;

	// Delete first (if exists) to reset position - this is the LRU "move to top"
	history.delete(key);

	// Add to end (most recent)
	history.set(key, {
		descriptor,
		navigatorKey,
		timestamp: Date.now(),
	});

	// Evict oldest if over limit
	while (history.size > HISTORY_LIMIT) {
		const oldestKey = history.keys().next().value;
		if (oldestKey) {
			history.delete(oldestKey);
		}
	}

	notifyListeners();
}

/**
 * Get most recent entry (for forward nav).
 */
function getMostRecent(): HistoryEntry | undefined {
	const entries = Array.from(history.values());
	return entries[entries.length - 1];
}

/**
 * Get N most recent entries (most recent first).
 */
function getRecent(n: number): HistoryEntry[] {
	const entries = Array.from(history.values());
	return entries.slice(-n).reverse();
}

/**
 * Get entry by key.
 */
function get(key: ScreenKey): HistoryEntry | undefined {
	return history.get(key);
}

/**
 * Check if key exists.
 */
function has(key: ScreenKey): boolean {
	return history.has(key);
}

/**
 * Get all entries for a navigator (in recency order, most recent first).
 */
function getByNavigator(navigatorKey: string): HistoryEntry[] {
	const entries: HistoryEntry[] = [];
	for (const entry of history.values()) {
		if (entry.navigatorKey === navigatorKey) {
			entries.push(entry);
		}
	}
	return entries.reverse();
}

/**
 * Get path between two screens (for multi-waypoint interpolation).
 * Returns keys in order from 'from' to 'to'.
 */
function getPath(fromKey: ScreenKey, toKey: ScreenKey): ScreenKey[] {
	const keys = Array.from(history.keys());
	const fromIndex = keys.indexOf(fromKey);
	const toIndex = keys.indexOf(toKey);

	if (fromIndex < 0 || toIndex < 0) return [];

	const start = Math.min(fromIndex, toIndex);
	const end = Math.max(fromIndex, toIndex);
	const path = keys.slice(start, end + 1);

	// Return in correct direction
	return fromIndex > toIndex ? path.reverse() : path;
}

/**
 * Clear all entries for a navigator (on unmount).
 */
function clearNavigator(navigatorKey: string): void {
	const keysToRemove: ScreenKey[] = [];
	for (const [key, entry] of history.entries()) {
		if (entry.navigatorKey === navigatorKey) {
			keysToRemove.push(key);
		}
	}

	if (keysToRemove.length > 0) {
		for (const key of keysToRemove) {
			history.delete(key);
		}
		notifyListeners();
	}
}

/**
 * Get current size of history.
 */
function size(): number {
	return history.size;
}

/**
 * Convert to array (in recency order, oldest first).
 */
function toArray(): HistoryEntry[] {
	return Array.from(history.values());
}

/**
 * Clear all history entries (for testing).
 * @internal
 */
function _reset(): void {
	history.clear();
	listeners.clear();
	cachedSnapshot = new Map();
}

export const HistoryStore = {
	focus,
	getMostRecent,
	getRecent,
	get,
	has,
	getByNavigator,
	getPath,
	clearNavigator,
	size,
	toArray,
	subscribe,
	getSnapshot,
	_reset,
};

export type { HistoryEntry };
