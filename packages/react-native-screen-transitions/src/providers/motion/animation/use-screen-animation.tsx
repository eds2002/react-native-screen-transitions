import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import type {
	ScreenInterpolationProps,
	ScreenTransitionTarget,
} from "../../../types/animation.types";
import { useOptionalBuilderStore } from "../../builder";
import { useResolvedTransitionKey } from "../../builder/topology";
import { useOptionalOrchestratorStore } from "../../orchestrator/orchestrator.provider";
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
	const currentKey = useOptionalBuilderStore(
		(store) => store?.derivations.currentScreenKey ?? null,
	);

	const localInterpolatorProps = useOptionalOrchestratorStore(
		(store) => store?.screenInterpolatorProps ?? null,
	);
	const localBoundsAccessor = useOptionalOrchestratorStore(
		(store) => store?.boundsAccessor ?? null,
	);

	const usesLocalStore =
		target === undefined || (typeof target === "object" && target.depth === 0);

	const screenKey = useResolvedTransitionKey(currentKey, target);

	const keyedInterpolatorProps = useOptionalOrchestratorStore(
		usesLocalStore ? null : screenKey,
		(store) => store.screenInterpolatorProps,
	);
	const keyedBoundsAccessor = useOptionalOrchestratorStore(
		usesLocalStore ? null : screenKey,
		(store) => store.boundsAccessor,
	);

	const screenInterpolatorProps = usesLocalStore
		? localInterpolatorProps
		: keyedInterpolatorProps;
	const boundsAccessor = usesLocalStore
		? localBoundsAccessor
		: keyedBoundsAccessor;

	if (usesLocalStore && (!localInterpolatorProps || !localBoundsAccessor)) {
		throw new Error(
			"useScreenAnimation requires a screen context when no external target is specified",
		);
	}

	const animation = useDerivedValue<ScreenInterpolationProps | null>(() => {
		if (!screenInterpolatorProps || !boundsAccessor) return null;

		return {
			...screenInterpolatorProps.get(),
			bounds: boundsAccessor,
		};
	});

	return animation;
}
