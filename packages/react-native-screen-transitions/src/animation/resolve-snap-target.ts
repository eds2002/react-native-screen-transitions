import { type HistoryEntry, HistoryStore } from "../stores/history.store";

const hasSnapPoints = (entry: HistoryEntry): boolean => {
	const snapPoints = entry.descriptor.options?.snapPoints;
	return Boolean(snapPoints && snapPoints.length > 0);
};

const getNavigatorLineage = (entry: HistoryEntry): string[] => {
	const keys: string[] = [];
	const visited = new Set<string>();

	let nav: any = entry.descriptor.navigation;
	while (nav) {
		const key = nav.getState?.()?.key;
		if (typeof key === "string" && key.length > 0 && !visited.has(key)) {
			keys.push(key);
			visited.add(key);
		}

		if (typeof nav.getParent !== "function") {
			break;
		}

		nav = nav.getParent();
	}

	if (!visited.has(entry.navigatorKey)) {
		keys.push(entry.navigatorKey);
	}

	return keys;
};

export function resolveSnapTargetEntry(): HistoryEntry | undefined {
	const anchor = HistoryStore.getMostRecent();
	if (!anchor) return undefined;

	const lineageKeys = getNavigatorLineage(anchor);

	for (const navigatorKey of lineageKeys) {
		const match = HistoryStore.getByNavigator(navigatorKey).find(hasSnapPoints);
		if (match) return match;
	}

	const all = HistoryStore.toArray();
	for (let i = all.length - 1; i >= 0; i--) {
		if (hasSnapPoints(all[i])) {
			return all[i];
		}
	}

	return undefined;
}
