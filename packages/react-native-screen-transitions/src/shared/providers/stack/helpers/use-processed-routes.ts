import { useMemo } from "react";
import {
	AnimationStore,
	type AnimationStoreMap,
} from "../../../stores/animation.store";
import type {
	BaseStackDescriptor,
	BaseStackScene,
} from "../../../types/stack.types";
import { isFloatOverlayVisible } from "../../../utils/overlay/visibility";

export interface ProcessedRoutes<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
> {
	scenes: BaseStackScene<TDescriptor>[];
	routeKeys: string[];
	backdropBehaviors: string[];
	animationMaps: AnimationStoreMap[];
	shouldShowFloatOverlay: boolean;
	activeScreensLimit: number;
}

/**
 * Processes raw routes + descriptors into derived arrays needed by the stack.
 * Single reverse pass computes: scenes, routeKeys, backdropBehaviors,
 * animationMaps, shouldShowFloatOverlay, and activeScreensLimit.
 */
export function useProcessedRoutes<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
>(
	routes: TDescriptor["route"][],
	descriptors: Record<string, TDescriptor>,
): ProcessedRoutes<TDescriptor> {
	return useMemo(() => {
		const scenes: BaseStackScene<TDescriptor>[] = [];
		const routeKeys: string[] = [];
		const backdropBehaviors: string[] = [];
		const animationMaps: AnimationStoreMap[] = [];

		let shouldShowFloatOverlay = false;
		let limit = 1;
		let stopLimit = false;

		for (let i = routes.length - 1; i >= 0; i--) {
			const route = routes[i];
			const descriptor = descriptors[route.key] as TDescriptor;
			const options = descriptor?.options;

			scenes[i] = { route, descriptor };
			routeKeys[i] = route.key;
			backdropBehaviors[i] = options?.backdropBehavior ?? "block";
			animationMaps[i] = AnimationStore.getRouteAnimations(route.key);

			if (!shouldShowFloatOverlay) {
				shouldShowFloatOverlay = isFloatOverlayVisible(options);
			}

			if (!stopLimit) {
				const shouldKeepPrevious =
					(options as { detachPreviousScreen?: boolean })
						?.detachPreviousScreen !== true;

				if (shouldKeepPrevious) {
					limit += 1;
				} else {
					stopLimit = true;
				}
			}
		}

		const activeScreensLimit = Math.min(
			limit,
			routes.length === 0 ? 1 : routes.length,
		);

		return {
			scenes,
			routeKeys,
			backdropBehaviors,
			animationMaps,
			shouldShowFloatOverlay,
			activeScreensLimit,
		};
	}, [routes, descriptors]);
}
