import { useMemo } from "react";
import { useBuilderStore } from "../../../../builder";
import { resolveScreenGestureConfig } from "../../shared/policy";
import type { ScreenGestureConfig } from "../../types";

export function useScreenGestureConfig(): ScreenGestureConfig {
	const options = useBuilderStore((store) => store.options);
	const isFirstKey = useBuilderStore((store) => store.derivations.isFirstKey);
	return useMemo(
		() =>
			resolveScreenGestureConfig({
				options,
				isFirstKey,
			}),
		[isFirstKey, options],
	);
}
