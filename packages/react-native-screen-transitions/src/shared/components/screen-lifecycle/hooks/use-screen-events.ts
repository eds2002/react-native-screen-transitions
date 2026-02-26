import { useEffect } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import useStableCallback from "../../../hooks/use-stable-callback";
import type { BaseDescriptor } from "../../../providers/screen/keys";
import type { AnimationStoreMap } from "../../../stores/animation.store";
import { HistoryStore } from "../../../stores/history.store";

function hasSnapPoints(descriptor: BaseDescriptor): boolean {
	const snapPoints = descriptor.options?.snapPoints;
	return Boolean(snapPoints && snapPoints.length > 0);
}

/**
 * Check if a screen is a leaf (renders visible content) vs a navigator container.
 * Navigator containers have nested state with routes.
 */
function isLeafScreen(navigation: BaseDescriptor["navigation"]): boolean {
	const state = navigation.getState();
	const index = state?.index ?? -1;
	const currentRoute = state?.routes?.[index];
	if (!currentRoute) return false;
	return !("state" in currentRoute);
}

function shouldTrackInHistory(descriptor: BaseDescriptor): boolean {
	return hasSnapPoints(descriptor) || isLeafScreen(descriptor.navigation);
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
		if (shouldTrackInHistory(current)) {
			HistoryStore.focus(current, navigatorKey);
		}

		// Also listen for focus events
		const unsubscribe = current.navigation.addListener?.("focus", () => {
			if (shouldTrackInHistory(current)) {
				HistoryStore.focus(current, navigatorKey);
			}
		});

		return () => unsubscribe?.();
	}, []);

	// When closing starts, focus previous in history
	const handleBlur = useStableCallback(() => {
		if (previous && shouldTrackInHistory(previous)) {
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
