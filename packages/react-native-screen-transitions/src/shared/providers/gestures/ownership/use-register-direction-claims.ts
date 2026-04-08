import { useEffect } from "react";
import { GestureStore } from "../../../stores/gesture.store";
import {
	type ClaimedDirections,
	DIRECTIONS,
	type Direction,
} from "../../../types/ownership.types";
import { useDescriptorDerivations } from "../../screen/descriptors";
import type { GestureContextType } from "../types";

/**
 * Registers direction claims on ancestors shadowed by the current screen.
 */
export function useRegisterDirectionClaims(
	ancestorContext: GestureContextType | null | undefined,
	claimedDirections: ClaimedDirections,
) {
	const { isTopMostScreen, currentScreenKey } = useDescriptorDerivations();
	useEffect(() => {
		if (!isTopMostScreen || !ancestorContext) {
			return;
		}

		const isDismissing = GestureStore.getBag(currentScreenKey).dismissing;

		const claimedAncestors: Array<{
			ancestor: GestureContextType;
			directions: Direction[];
		}> = [];

		let ancestor: GestureContextType | null = ancestorContext;
		while (ancestor) {
			/**
			 * NOTE:
			 * Blank stack can now handle itself as isolated, I think react navigation handles itself correctly in this scenario?
			 * Is this check even needed anymore?
			 */
			// if (ancestor.isIsolated !== isIsolated) break;

			const shadowedDirections: Direction[] = [];
			for (const dir of DIRECTIONS) {
				if (claimedDirections[dir] && ancestor.claimedDirections?.[dir]) {
					shadowedDirections.push(dir);
				}
			}

			if (shadowedDirections.length > 0) {
				claimedAncestors.push({ ancestor, directions: shadowedDirections });
				const newClaims = { ...ancestor.childDirectionClaims.value };
				for (const dir of shadowedDirections) {
					newClaims[dir] = { routeKey: currentScreenKey, isDismissing };
				}
				ancestor.childDirectionClaims.value = newClaims;
			}

			ancestor = ancestor.ancestorContext;
		}

		return () => {
			for (const { ancestor, directions } of claimedAncestors) {
				const currentClaims = ancestor.childDirectionClaims.value;
				const newClaims = { ...currentClaims };
				let needsUpdate = false;

				for (const dir of directions) {
					if (currentClaims[dir]?.routeKey === currentScreenKey) {
						newClaims[dir] = null;
						needsUpdate = true;
					}
				}

				if (needsUpdate) {
					ancestor.childDirectionClaims.value = newClaims;
				}
			}
		};
	}, [ancestorContext, claimedDirections, currentScreenKey, isTopMostScreen]);
}
