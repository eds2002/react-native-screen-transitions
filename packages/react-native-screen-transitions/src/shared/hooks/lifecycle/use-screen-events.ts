import { useLayoutEffect } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import type { BaseDescriptor } from "../../providers/screen/keys.provider";
import type { AnimationStoreMap } from "../../stores/animation.store";
import useStableCallback from "../use-stable-callback";

/**
 * Emits screenFocus and screenBlur events via navigation.emit().
 * These events can be listened to by users via navigation.addListener().
 */
export function useScreenEvents(
	current: BaseDescriptor,
	previous: BaseDescriptor | undefined,
	animations: AnimationStoreMap,
) {
	// Emit focus on mount
	// biome-ignore lint/correctness/useExhaustiveDependencies: Must only run once on mount
	useLayoutEffect(() => {
		current.navigation.emit?.({
			type: "screenFocus",
			data: { descriptor: current, previous },
			target: current.route.key,
		});
	}, []);

	// Emit blur when closing starts
	const emitBlur = useStableCallback(() => {
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
				runOnJS(emitBlur)();
			}
		},
	);
}
