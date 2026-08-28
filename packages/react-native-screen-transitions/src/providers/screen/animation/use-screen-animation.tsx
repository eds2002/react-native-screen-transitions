import { useCallback, useSyncExternalStore } from "react";
import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import { transition } from "../../../animation/transition";
import type {
	ScreenInterpolationProps,
	ScreenTransitionTarget,
} from "../../../types/animation.types";
import { useDescriptorsStore } from "../descriptors";
import { screenTopology, useResolvedTransitionKey } from "../topology";
import type { ScreenAnimationTarget } from "./types";

export type { ScreenAnimationTarget } from "./types";

export function useScreenAnimation(): DerivedValue<ScreenInterpolationProps>;
export function useScreenAnimation(target: {
	depth: 0;
}): DerivedValue<ScreenInterpolationProps>;
export function useScreenAnimation(
	target: ScreenTransitionTarget,
): DerivedValue<ScreenInterpolationProps | null>;
export function useScreenAnimation(
	target?: ScreenAnimationTarget,
):
	| DerivedValue<ScreenInterpolationProps>
	| DerivedValue<ScreenInterpolationProps | null> {
	const currentKey = useDescriptorsStore((s) => s.derivations.currentScreenKey);
	const transitionKey = useResolvedTransitionKey(currentKey, target);

	const subscribe = useCallback(
		(listener: () => void) =>
			transitionKey
				? screenTopology.subscribeTransition(transitionKey, listener)
				: () => {},
		[transitionKey],
	);

	const getSnapshot = useCallback(
		() => (transitionKey ? transition(transitionKey) : null),
		[transitionKey],
	);

	const transitionValue = useSyncExternalStore(
		subscribe,
		getSnapshot,
		getSnapshot,
	);

	const animation = useDerivedValue<ScreenInterpolationProps | null>(() => {
		return transitionValue?.get() ?? null;
	});

	return animation;
}
