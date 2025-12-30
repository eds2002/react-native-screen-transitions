import { useEffect } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import type { BaseDescriptor } from "../../providers/screen/keys.provider";
import type { AnimationStoreMap } from "../../stores/animation.store";
import { HistoryStore } from "../../stores/history.store";
import useStableCallback from "../use-stable-callback";

/**
 * Check if a screen is a leaf (renders visible content) vs a navigator container.
 * Navigator containers have nested state with routes.
 */
function isLeafScreen(navigation: BaseDescriptor["navigation"]): boolean {
	const state = navigation.getState();
	const currentRoute = state.routes[state.index];
	return !("state" in currentRoute);
}

/**
 * Updates the HistoryStore for navigation history tracking.
 */
export function useScreenEvents(
	current: BaseDescriptor,
	previous: BaseDescriptor | undefined,
	animations: AnimationStoreMap,
) {
	const navigatorKey = current.navigation.getState()?.key ?? "";

	// Track history via focus listener - waits for nested navigators to initialize
	// biome-ignore lint/correctness/useExhaustiveDependencies: Must only run once on mount
	useEffect(() => {
		// Check on mount (after paint, nested navs initialized)
		if (isLeafScreen(current.navigation)) {
			HistoryStore.focus(current, navigatorKey);
		}

		// Also listen for focus events
		const unsubscribe = current.navigation.addListener?.("focus", () => {
			if (isLeafScreen(current.navigation)) {
				HistoryStore.focus(current, navigatorKey);
			}
		});

		return () => unsubscribe?.();
	}, []);

	// When closing starts, focus previous in history
	const handleBlur = useStableCallback(() => {
		if (previous && isLeafScreen(previous.navigation)) {
			const prevNavigatorKey = previous.navigation.getState()?.key ?? "";
			HistoryStore.focus(previous, prevNavigatorKey);
		}
	});

	useAnimatedReaction(
		() => animations.closing.get(),
		(closing, prevClosing) => {
			if (closing && !prevClosing) {
				runOnJS(handleBlur)();
			}
		},
	);
}
