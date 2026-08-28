import { useMemo } from "react";
import { useDescriptorsStore } from "../../descriptors";
import { resolveScreenGestureConfig } from "../shared/policy";
import type { ScreenGestureConfig } from "../types";

export function useScreenGestureConfig(): ScreenGestureConfig {
	const options = useDescriptorsStore((store) => store.options);
	const isFirstKey = useDescriptorsStore(
		(store) => store.derivations.isFirstKey,
	);
	return useMemo(
		() =>
			resolveScreenGestureConfig({
				options,
				isFirstKey,
			}),
		[isFirstKey, options],
	);
}
