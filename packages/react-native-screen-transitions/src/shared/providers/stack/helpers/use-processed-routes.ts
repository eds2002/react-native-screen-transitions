import { useMemo } from "react";
import {
	AnimationStore,
	type AnimationStoreMap,
} from "../../../stores/animation.store";
import type { BackdropBehavior } from "../../../types/screen.types";
import type {
	BaseStackDescriptor,
	BaseStackScene,
} from "../../../types/stack.types";
import { isOverlayVisible } from "../../../utils/overlay/visibility";

export interface ProcessedRoutes<
	TDescriptor extends BaseStackDescriptor = BaseStackDescriptor,
> {
	scenes: BaseStackScene<TDescriptor>[];
	routeKeys: string[];
	backdropBehaviors: BackdropBehavior[];
	animationMaps: AnimationStoreMap[];
	shouldShowFloatOverlay: boolean;
}

/**
 * Processes raw routes + descriptors into derived arrays needed by the stack.
 * Single reverse pass computes: scenes, routeKeys, backdropBehaviors,
 * animationMaps, and shouldShowFloatOverlay.
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
		const backdropBehaviors: BackdropBehavior[] = [];
		const animationMaps: AnimationStoreMap[] = [];

		let shouldShowFloatOverlay = false;

		for (let i = routes.length - 1; i >= 0; i--) {
			const route = routes[i];
			const descriptor = descriptors[route.key] as TDescriptor;
			const options = descriptor?.options;

			scenes[i] = { route, descriptor };
			routeKeys[i] = route.key;
			backdropBehaviors[i] = options?.backdropBehavior ?? "block";
			animationMaps[i] = AnimationStore.getBag(route.key);

			if (!shouldShowFloatOverlay) {
				shouldShowFloatOverlay = isOverlayVisible(options);
			}
		}

		return {
			scenes,
			routeKeys,
			backdropBehaviors,
			animationMaps,
			shouldShowFloatOverlay,
		};
	}, [routes, descriptors]);
}
