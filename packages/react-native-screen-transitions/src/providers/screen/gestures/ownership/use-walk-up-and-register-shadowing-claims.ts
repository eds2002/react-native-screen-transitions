import { useLayoutEffect, useMemo } from "react";
import { GestureStore } from "../../../../stores/gesture.store";
import {
	type ClaimedDirections,
	DIRECTIONS,
	type Direction,
	NO_CLAIMS,
} from "../../../../types/ownership.types";
import {
	type BaseDescriptor,
	useDescriptorDerivations,
	useDescriptors,
} from "../../../screen/descriptors";
import { useGestureContext } from "../gestures.provider";
import { walkGestureAncestors } from "../shared/ancestors";
import { resolveScreenGestureConfig } from "../shared/policy";
import type { GestureContextType } from "../types";
import { resolveShadowingClaimDirections } from "./shadowing-claims";

type ShadowedAncestor = {
	ancestor: GestureContextType;
	directions: Direction[];
};

const NO_SHADOWED_ANCESTORS: ShadowedAncestor[] = [];

const findShadowedDirections = (
	claimedDirections: ClaimedDirections,
	ancestorDirections: ClaimedDirections,
) => {
	const shadowedDirections: Direction[] = [];

	for (const dir of DIRECTIONS) {
		if (claimedDirections[dir] && ancestorDirections[dir]) {
			shadowedDirections.push(dir);
		}
	}

	return shadowedDirections;
};

const findShadowedAncestors = (
	parentContext: GestureContextType | null,
	claimedDirections: ClaimedDirections,
) => {
	if (!parentContext) {
		return NO_SHADOWED_ANCESTORS;
	}

	const ancestors: ShadowedAncestor[] = [];
	for (const ancestor of walkGestureAncestors(parentContext)) {
		const directions = findShadowedDirections(
			claimedDirections,
			ancestor.claimedDirections,
		);

		if (directions.length > 0) {
			ancestors.push({ ancestor, directions });
		}
	}

	return ancestors.length ? ancestors : NO_SHADOWED_ANCESTORS;
};

const registerShadowingClaims = (
	shadowedAncestors: ShadowedAncestor[],
	currentScreenKey: string,
) => {
	const isDismissing = GestureStore.getValue(currentScreenKey, "dismissing");

	for (const { ancestor, directions } of shadowedAncestors) {
		const newClaims = { ...ancestor.childDirectionClaims.get() };
		for (const dir of directions) {
			newClaims[dir] = { routeKey: currentScreenKey, isDismissing };
		}
		ancestor.childDirectionClaims.set(newClaims);
	}
};

const clearShadowingClaims = (
	shadowedAncestors: ShadowedAncestor[],
	currentScreenKey: string,
) => {
	for (const { ancestor, directions } of shadowedAncestors) {
		const currentClaims = ancestor.childDirectionClaims.get();
		const newClaims = { ...currentClaims };
		let needsUpdate = false;

		for (const dir of directions) {
			// Only remove claims written by this screen; a newer descendant may own it now.
			if (currentClaims[dir]?.routeKey === currentScreenKey) {
				newClaims[dir] = null;
				needsUpdate = true;
			}
		}

		if (needsUpdate) {
			ancestor.childDirectionClaims.set(newClaims);
		}
	}
};

const getDescriptorIsFirstKey = (descriptor: BaseDescriptor): boolean => {
	const navigationState = descriptor.navigation.getState();
	const routes = navigationState?.routes ?? [];
	return routes.findIndex((route) => route.key === descriptor.route.key) === 0;
};

const getDescriptorClaimedDirections = (
	descriptor: BaseDescriptor | undefined,
	gestureContext: GestureContextType | null,
): ClaimedDirections => {
	if (!descriptor) {
		return NO_CLAIMS;
	}

	return resolveScreenGestureConfig({
		options: descriptor.options,
		isFirstKey: getDescriptorIsFirstKey(descriptor),
		gestureContext,
	}).participation.claimedDirections;
};

/**
 * Registers this screen with ancestors that claim the same direction.
 *
 * Example, when C is top-most:
 * A claims vertical
 * └─ B claims horizontal
 *    └─ C claims vertical
 *
 * C walks up the tree and writes itself into A.childDirectionClaims.vertical.
 * B is skipped because it does not claim vertical.
 */
export function useWalkUpAndRegisterShadowingClaims(
	claimedDirections: ClaimedDirections,
): void {
	const parentContext = useGestureContext();
	const { current, previous } = useDescriptors();
	const { isTopMostScreen, currentScreenKey } = useDescriptorDerivations();

	/*
	 * We want to calculate effective claimed directions as claimedDirections is not enough for us.
	 * What this solves is lingering claimed directions when a screen is closing.
	 *
	 * Overlay claims horizontal
	 *   └─ A has no local horizontal claim
	 *   └─ B claims horizontal (closing)
	 *   └─ C claims horizontal (closing)
	 *
	 * Closing screens are still mounted, so they can still block parent gestures.
	 * But they cannot receive touches anymore.
	 *
	 * So when B/C are closing and the user is really touching A, B/C should not
	 * keep blocking the parent with their own gesture config.
	 *
	 * A closing screen should act like the visible screen underneath it:
	 * - if the screen underneath claims the gesture, keep blocking the parent
	 * - if the screen underneath does not claim it, let the parent handle it
	 */
	const effectiveClaimedDirections = useMemo(
		() =>
			resolveShadowingClaimDirections({
				currentActivity: current.activity,
				currentClaimedDirections: claimedDirections,
				previousClaimedDirections: getDescriptorClaimedDirections(
					previous,
					parentContext,
				),
			}),
		[current.activity, claimedDirections, previous, parentContext],
	);

	const shadowedAncestors = useMemo(
		() => findShadowedAncestors(parentContext, effectiveClaimedDirections),
		[parentContext, effectiveClaimedDirections],
	);

	useLayoutEffect(() => {
		if (!isTopMostScreen || !shadowedAncestors.length) {
			return;
		}

		registerShadowingClaims(shadowedAncestors, currentScreenKey);

		return () => {
			clearShadowingClaims(shadowedAncestors, currentScreenKey);
		};
	}, [shadowedAncestors, currentScreenKey, isTopMostScreen]);
}
