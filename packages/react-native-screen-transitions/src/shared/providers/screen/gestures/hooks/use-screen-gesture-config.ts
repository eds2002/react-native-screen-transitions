import { usePreventRemoveContext } from "@react-navigation/native";
import { useMemo } from "react";
import { useDescriptorsStore } from "../../descriptors";
import { resolveScreenGestureConfig } from "../shared/policy";
import type { GestureContextType, ScreenGestureConfig } from "../types";

export function useScreenGestureConfig(
	gestureContext: GestureContextType | null,
): ScreenGestureConfig {
	const options = useDescriptorsStore((store) => store.options);
	const isFirstKey = useDescriptorsStore(
		(store) => store.derivations.isFirstKey,
	);
	const currentScreenKey = useDescriptorsStore(
		(store) => store.derivations.currentScreenKey,
	);
	const { preventedRoutes } = usePreventRemoveContext();
	const isRemovePrevented =
		preventedRoutes[currentScreenKey]?.preventRemove === true;

	return useMemo(
		() =>
			resolveScreenGestureConfig({
				options,
				isFirstKey,
				gestureContext,
				isRemovePrevented,
			}),
		[isFirstKey, options, gestureContext, isRemovePrevented],
	);
}
