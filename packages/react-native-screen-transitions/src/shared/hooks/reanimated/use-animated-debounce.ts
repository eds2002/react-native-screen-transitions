import {
	cancelAnimation,
	useAnimatedReaction,
	useSharedValue,
	withDelay,
	withTiming,
} from "react-native-reanimated";

const SCROLL_SETTLE_DELAY_MS = 25;

interface AnimatedDebounceControls {
	trigger: () => void;
	cancel: () => void;
}

/**
 * Debounces a UI-thread callback using Reanimated timing primitives.
 *
 * Call `trigger()` from a worklet to reset the debounce window. When no new
 * trigger arrives within `delayMs`, `onDebounced` fires once on the UI thread.
 */
export function useAnimatedDebounce(
	onDebounced: () => void,
	delayMs: number = SCROLL_SETTLE_DELAY_MS,
): AnimatedDebounceControls {
	const token = useSharedValue(0);

	const trigger = () => {
		"worklet";
		cancelAnimation(token);
		token.set(withDelay(delayMs, withTiming(token.get() + 1, { duration: 0 })));
	};

	const cancel = () => {
		"worklet";
		cancelAnimation(token);
	};

	useAnimatedReaction(
		() => token.get(),
		(nextToken, previousToken) => {
			"worklet";
			if (nextToken === 0 || nextToken === previousToken) {
				return;
			}

			onDebounced();
		},
		[delayMs, onDebounced],
	);

	return { trigger, cancel };
}
