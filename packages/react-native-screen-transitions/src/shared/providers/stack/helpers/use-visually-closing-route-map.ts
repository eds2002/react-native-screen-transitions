import { useDerivedValue } from "react-native-reanimated";
import { useSharedValueState } from "../../../hooks/reanimated/use-shared-value-state";
import type { AnimationStoreMap } from "../../../stores/animation.store";

export const useVisuallyClosingRouteMap = (
	routeKeys: string[],
	animationMaps: AnimationStoreMap[],
): Readonly<Record<string, true>> => {
	return useSharedValueState(
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
