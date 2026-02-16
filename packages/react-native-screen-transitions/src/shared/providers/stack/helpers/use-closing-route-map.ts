import { useDerivedValue } from "react-native-reanimated";
import { useSharedValueRef } from "../../../hooks/reanimated/use-shared-value-ref";
import type { AnimationStoreMap } from "../../../stores/animation.store";

/**
 * Ref-based hash map of routes that are visually closing.
 * Derived on the UI thread and bridged to a JS ref — no rerenders.
 */
export const useClosingRouteMap = (
	routeKeys: string[],
	animationMaps: AnimationStoreMap[],
): React.RefObject<Readonly<Record<string, true>>> => {
	return useSharedValueRef(
		useDerivedValue(() => {
			"worklet";
			const map: Record<string, true> = {};
			for (let i = 0; i < animationMaps.length; i++) {
				if (animationMaps[i].closing.value > 0) {
					const routeKey = routeKeys[i];
					if (routeKey) {
						map[routeKey] = true;
					}
				}
			}
			return map;
		}),
	);
};
