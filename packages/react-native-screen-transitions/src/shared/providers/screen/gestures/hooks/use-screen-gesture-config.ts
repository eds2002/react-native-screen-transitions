import { usePreventRemoveContext } from "@react-navigation/native";
import { useMemo } from "react";
import { useDescriptorsStore } from "../../descriptors";
import { useGestureStore } from "../gestures.provider";
import { resolveScreenGestureConfig } from "../shared/policy";
import type { ScreenGestureConfig } from "../types";

export function useScreenGestureConfig(): ScreenGestureConfig {
	const gestureContext = useGestureStore();
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
