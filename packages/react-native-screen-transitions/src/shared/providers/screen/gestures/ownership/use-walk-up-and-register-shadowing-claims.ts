import { useEffect, useMemo } from "react";
import { GestureStore } from "../../../../stores/gesture.store";
import {
	type ClaimedDirections,
	DIRECTIONS,
	type Direction,
} from "../../../../types/ownership.types";
import { useDescriptorDerivations } from "../../../screen/descriptors";
import { useGestureContext } from "../gestures.provider";
import { walkGestureAncestors } from "../shared/ancestors";
import type { GestureContextType } from "../types";

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
	const { isTopMostScreen, currentScreenKey } = useDescriptorDerivations();

	const shadowedAncestors = useMemo(
		() => findShadowedAncestors(parentContext, claimedDirections),
		[parentContext, claimedDirections],
	);

	useEffect(() => {
		if (!isTopMostScreen || !shadowedAncestors.length) {
			return;
		}

		registerShadowingClaims(shadowedAncestors, currentScreenKey);

		return () => {
			clearShadowingClaims(shadowedAncestors, currentScreenKey);
		};
	}, [shadowedAncestors, currentScreenKey, isTopMostScreen]);
}
