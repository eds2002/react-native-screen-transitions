import { useMemo } from "react";
import { useDescriptorDerivations, useDescriptors } from "../../descriptors";
import { useGestureContext } from "../gestures.provider";
import { resolveScreenGestureConfig } from "../shared/policy";
import type { ScreenGestureConfig } from "../types";

export function useScreenGestureConfig(): ScreenGestureConfig {
	const gestureContext = useGestureContext();
	const {
		current: { options },
	} = useDescriptors();

	const { isFirstKey } = useDescriptorDerivations();

	return useMemo(
		() =>
			resolveScreenGestureConfig({
				options,
				isFirstKey,
				gestureContext,
			}),
		[isFirstKey, options, gestureContext],
	);
}
