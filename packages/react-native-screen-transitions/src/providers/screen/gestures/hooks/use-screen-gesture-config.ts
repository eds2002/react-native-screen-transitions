import { usePreventRemoveContext } from "@react-navigation/native";
import { useMemo } from "react";
import { useDescriptorsStore } from "../../descriptors";
import { resolveScreenGestureConfig } from "../shared/policy";
import type { ScreenGestureConfig, ScreenGestureSource } from "../types";

export function useScreenGestureConfig(
	ancestorGestures: readonly ScreenGestureSource[],
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
				ancestorGestures,
				isRemovePrevented,
			}),
		[isFirstKey, options, ancestorGestures, isRemovePrevented],
	);
}
