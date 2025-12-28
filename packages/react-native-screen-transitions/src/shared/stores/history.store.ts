import type { BaseStackDescriptor } from "../types/stack.types";
import type { ScreenKey } from "../types/screen.types";

interface HistoryEntry {
	descriptor: BaseStackDescriptor;
	navigatorKey: string;
}

let history: HistoryEntry[] = [];
const listeners = new Set<() => void>();

function notifyListeners(): void {
	// Defer to avoid "Cannot update a component while rendering another"
	queueMicrotask(() => {
		listeners.forEach((listener) => listener());
	});
}

function subscribe(listener: () => void): () => void {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

function getSnapshot(): readonly HistoryEntry[] {
	return history;
}

function add(descriptor: BaseStackDescriptor, navigatorKey: string): void {
	const key = descriptor.route.key;
	const existingIndex = history.findIndex((e) => e.descriptor.route.key === key);

	const entry: HistoryEntry = { descriptor, navigatorKey };

	if (existingIndex >= 0) {
		// Create new array with updated entry
		history = [
			...history.slice(0, existingIndex),
			entry,
			...history.slice(existingIndex + 1),
		];
	} else {
		// Create new array with new entry
		history = [...history, entry];
	}
	notifyListeners();
}

function remove(key: ScreenKey): void {
	const index = history.findIndex((e) => e.descriptor.route.key === key);
	if (index >= 0) {
		// Create new array without the entry
		history = [...history.slice(0, index), ...history.slice(index + 1)];
		notifyListeners();
	}
}

function indexOf(key: ScreenKey): number {
	return history.findIndex((e) => e.descriptor.route.key === key);
}

function at(index: number): HistoryEntry | undefined {
	return history[index];
}

export const HistoryStore = {
	add,
	remove,
	indexOf,
	at,
	subscribe,
	getSnapshot,
};
