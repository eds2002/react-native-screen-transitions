import { useEffect, useMemo } from "react";
import { GestureStore } from "../../../../stores/gesture.store";
import {
	type ClaimedDirections,
	DIRECTIONS,
	type Direction,
} from "../../../../types/ownership.types";
import { useDescriptorDerivations } from "../../../screen/descriptors";
import { useGestureContext } from "../gestures.provider";
import { walkGestureAncestors } from "../helpers/walk-gesture-ancestors";
import type { GestureContextType } from "../types";

type ShadowedAncestor = {
	ancestor: GestureContextType;
	directions: Direction[];
};

const NO_SHADOWED_ANCESTORS: ShadowedAncestor[] = [];

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

	const shadowedAncestors = useMemo(() => {
		if (!parentContext) return NO_SHADOWED_ANCESTORS;

		const ancestors: ShadowedAncestor[] = [];
		for (const ancestor of walkGestureAncestors(parentContext)) {
			const shadowedDirections: Direction[] = [];

			for (const dir of DIRECTIONS) {
				if (claimedDirections[dir] && ancestor.claimedDirections?.[dir]) {
					shadowedDirections.push(dir);
				}
			}

			if (shadowedDirections.length > 0) {
				ancestors.push({ ancestor, directions: shadowedDirections });
			}
		}

		return ancestors.length ? ancestors : NO_SHADOWED_ANCESTORS;
	}, [parentContext, claimedDirections]);

	useEffect(() => {
		if (!isTopMostScreen || !shadowedAncestors.length) {
			return;
		}

		const isDismissing = GestureStore.getValue(currentScreenKey, "dismissing");

		for (const { ancestor, directions } of shadowedAncestors) {
			const newClaims = { ...ancestor.childDirectionClaims.get() };
			for (const dir of directions) {
				newClaims[dir] = { routeKey: currentScreenKey, isDismissing };
			}
			ancestor.childDirectionClaims.set(newClaims);
		}

		return () => {
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
	}, [shadowedAncestors, currentScreenKey, isTopMostScreen]);
}
