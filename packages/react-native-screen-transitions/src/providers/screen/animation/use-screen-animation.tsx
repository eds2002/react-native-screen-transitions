import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import type {
	ScreenInterpolationProps,
	ScreenTransitionTarget,
} from "../../../types/animation.types";
import { useOptionalDescriptorsStore } from "../descriptors";
import { useResolvedTransitionKey } from "../topology";
import {
	useOptionalScreenAnimationStore,
	useScreenAnimationStore,
} from "./animation.provider";
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
	const currentKey = useOptionalDescriptorsStore(
		(store) => store?.derivations.currentScreenKey ?? null,
	);

	const localInterpolatorProps = useScreenAnimationStore(
		(store) => store.screenInterpolatorProps,
	);
	const localBoundsAccessor = useScreenAnimationStore(
		(store) => store.boundsAccessor,
	);

	const usesLocalStore =
		target === undefined || (typeof target === "object" && target.depth === 0);

	const screenKey = useResolvedTransitionKey(currentKey, target);

	const keyedInterpolatorProps = useOptionalScreenAnimationStore(
		usesLocalStore ? null : screenKey,
		(store) => store.screenInterpolatorProps,
	);
	const keyedBoundsAccessor = useOptionalScreenAnimationStore(
		usesLocalStore ? null : screenKey,
		(store) => store.boundsAccessor,
	);

	const screenInterpolatorProps = usesLocalStore
		? localInterpolatorProps
		: keyedInterpolatorProps;
	const boundsAccessor = usesLocalStore
		? localBoundsAccessor
		: keyedBoundsAccessor;

	const animation = useDerivedValue<ScreenInterpolationProps | null>(() => {
		if (!screenInterpolatorProps || !boundsAccessor) return null;

		return {
			...screenInterpolatorProps.get(),
			bounds: boundsAccessor,
		};
	});

	return animation;
}
