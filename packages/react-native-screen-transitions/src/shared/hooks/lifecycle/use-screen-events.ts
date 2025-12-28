import { useLayoutEffect } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import type { BaseDescriptor } from "../../providers/screen/keys.provider";
import type { AnimationStoreMap } from "../../stores/animation.store";
import { HistoryStore } from "../../stores/history.store";
import useStableCallback from "../use-stable-callback";

/**
 * Emits screenFocus and screenBlur events via navigation.emit().
 * Also updates the HistoryStore for navigation history tracking.
 */
export function useScreenEvents(
	current: BaseDescriptor,
	previous: BaseDescriptor | undefined,
	animations: AnimationStoreMap,
) {
	const navigatorKey = current.navigation.getState()?.key ?? "";

	// Focus on mount - emit event and update history
	// biome-ignore lint/correctness/useExhaustiveDependencies: Must only run once on mount
	useLayoutEffect(() => {
		HistoryStore.focus(current, navigatorKey);
		current.navigation.emit?.({
			type: "screenFocus",
			data: { descriptor: current, previous },
			target: current.route.key,
		});
	}, []);

	// Blur when closing starts - emit event and focus previous in history
	const handleBlur = useStableCallback(() => {
		if (previous) {
			const prevNavigatorKey = previous.navigation.getState()?.key ?? "";
			HistoryStore.focus(previous, prevNavigatorKey);
		}

		current.navigation.emit?.({
			type: "screenBlur",
			data: { descriptor: current, previous },
			target: current.route.key,
		});
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
