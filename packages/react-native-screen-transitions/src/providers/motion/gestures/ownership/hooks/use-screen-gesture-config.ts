import { useMemo } from "react";
import { useBuilderStore } from "../../../../builder";
import { screenOptionInputs } from "../../../options/helpers";
import { resolveScreenGestureConfig } from "../../shared/policy";
import type { ScreenGestureConfig } from "../../types";

export function useScreenGestureConfig(): ScreenGestureConfig {
	const options = useBuilderStore((store) => store.options);
	const isFirstKey = useBuilderStore((store) => store.derivations.isFirstKey);

	const inputs = [
		isFirstKey,
		options.snapPoints,
		...screenOptionInputs(options),
	];
	return useMemo(
		() => resolveScreenGestureConfig({ options, isFirstKey }),
		// biome-ignore lint/correctness/useExhaustiveDependencies: the inputs are the options it reads.
		inputs,
	);
}
