import {
	useFocusEffect,
	useNavigation,
	useRoute,
} from "@react-navigation/native";
import { useLayoutEffect } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import useStableCallback from "../hooks/use-stable-callback";
import { AnimationStore } from "../stores/animation.store";
import { HistoryStore } from "../stores/history.store";
import createProvider from "../utils/create-provider";

export interface HistoryContextType {
	/**
	 * The current route key
	 */
	routeKey: string;
	/**
	 * The current route name
	 */
	routeName: string;
	/**
	 * The navigator key this screen belongs to
	 */
	navigatorKey: string;
}

interface HistoryProviderProps {
	children: React.ReactNode;
}

export const { HistoryProvider, useHistoryContext } = createProvider(
	"History",
	{ guarded: true },
)<HistoryProviderProps, HistoryContextType>(({ children }) => {
	const route = useRoute();
	const navigation = useNavigation();
	const navState = navigation.getState();
	const navigatorKey = navState?.key ?? "";
	const routeKey = route.key;
	const routeName = route.name;

	// Build a minimal descriptor-like object for HistoryStore
	const descriptor = {
		route: { key: routeKey, name: routeName },
		navigation,
	};

	const animations = AnimationStore.getAll(routeKey);

	// Get the previous route from navigation state
	const routes = navState?.routes ?? [];
	const currentIndex = routes.findIndex((r) => r.key === routeKey);
	const previousRoute = currentIndex > 0 ? routes[currentIndex - 1] : null;

	// Add to history on mount/focus (LRU: moves to top if already exists)
	useLayoutEffect(() => {
		HistoryStore.focus(descriptor as any, navigatorKey);
	}, [navigatorKey]);

	useFocusEffect(() => {});

	// When closing starts, focus the previous screen in history
	// This ensures getMostRecent() returns the destination screen during dismissal
	const focusPrevious = useStableCallback(() => {
		if (!previousRoute) return;
		const prevDescriptor = {
			route: { key: previousRoute.key, name: previousRoute.name },
			navigation,
		};
		HistoryStore.focus(prevDescriptor as any, navigatorKey);
	});

	useAnimatedReaction(
		() => animations.closing.get(),
		(closing, prevClosing) => {
			// Only trigger when closing transitions from 0 to 1
			if (closing && !prevClosing) {
				runOnJS(focusPrevious)();
			}
		},
	);

	const value: HistoryContextType = {
		routeKey,
		routeName,
		navigatorKey,
	};

	return {
		value,
		children,
	};
});
