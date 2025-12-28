import { useMemo, useSyncExternalStore } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { BaseStackDescriptor, BaseStackRoute } from "../../types/stack.types";
import { HistoryStore } from "../../stores/history.store";

interface ScreenKeysResult<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
> {
	previous?: TDescriptor;
	current: TDescriptor;
	next?: TDescriptor;
}

export function useScreenKeys<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
>(): ScreenKeysResult<TDescriptor> {
	const route = useRoute();
	const navigation = useNavigation();
	const navigatorKey = navigation.getState()?.key ?? "";

	// Subscribe for re-renders when history changes
	useSyncExternalStore(
		HistoryStore.subscribe,
		HistoryStore.getSnapshot,
		HistoryStore.getSnapshot,
	);

	// Always read fresh from store
	const history = HistoryStore.getSnapshot();

	// Filter to only screens in the same navigator
	const navigatorHistory = history.filter(
		(e) => e.navigatorKey === navigatorKey,
	);

	let index = navigatorHistory.findIndex(
		(e) => e.descriptor.route.key === route.key,
	);

	// If found in filtered history, return normally
	if (index !== -1) {
		return {
			previous: navigatorHistory[index - 1]?.descriptor as TDescriptor | undefined,
			current: navigatorHistory[index].descriptor as TDescriptor,
			next: navigatorHistory[index + 1]?.descriptor as TDescriptor | undefined,
		};
	}

	// Check full history (handles navigator key mismatch)
	const fullIndex = history.findIndex(
		(e) => e.descriptor.route.key === route.key,
	);
	if (fullIndex !== -1) {
		const entry = history[fullIndex];
		const siblings = history.filter(
			(e) => e.navigatorKey === entry.navigatorKey,
		);
		index = siblings.findIndex(
			(e) => e.descriptor.route.key === route.key,
		);
		return {
			previous: siblings[index - 1]?.descriptor as TDescriptor | undefined,
			current: entry.descriptor as TDescriptor,
			next: siblings[index + 1]?.descriptor as TDescriptor | undefined,
		};
	}

	// Screen not in history (was removed or not yet added)
	// Create a minimal fallback descriptor
	const fallbackDescriptor = {
		route: route as BaseStackRoute,
		navigation: navigation as TDescriptor["navigation"],
		options: {} as TDescriptor["options"],
	} as TDescriptor;

	return {
		previous: undefined,
		current: fallbackDescriptor,
		next: undefined,
	};
}
