import { useEffect } from "react";
import { GestureStore } from "../../../stores/gesture.store";
import {
	type ClaimedDirections,
	DIRECTIONS,
	type Direction,
} from "../../../types/ownership.types";
import { useDescriptorDerivations } from "../../screen/descriptors";
import { useGestureContext } from "../gestures.provider";
import type { GestureContextType } from "../types";

/**
 * Registers direction claims on ancestors shadowed by the current screen.
 */
export function useRegisterDirectionClaims(
	claimedDirections: ClaimedDirections,
) {
	const gestureContext = useGestureContext();
	const { isTopMostScreen, currentScreenKey } = useDescriptorDerivations();

	useEffect(() => {
		if (!isTopMostScreen || !gestureContext) {
			return;
		}

		const isDismissing = GestureStore.getValue(currentScreenKey, "dismissing");

		const claimedAncestors: Array<{
			ancestor: GestureContextType;
			directions: Direction[];
		}> = [];

		let ancestor: GestureContextType | null = gestureContext;
		while (ancestor) {
			const shadowedDirections: Direction[] = [];
			for (const dir of DIRECTIONS) {
				if (claimedDirections[dir] && ancestor.claimedDirections?.[dir]) {
					shadowedDirections.push(dir);
				}
			}

			if (shadowedDirections.length > 0) {
				claimedAncestors.push({ ancestor, directions: shadowedDirections });
				const newClaims = { ...ancestor.childDirectionClaims.get() };
				for (const dir of shadowedDirections) {
					newClaims[dir] = { routeKey: currentScreenKey, isDismissing };
				}
				ancestor.childDirectionClaims.set(newClaims);
			}

			ancestor = ancestor.gestureContext;
		}

		return () => {
			for (const { ancestor, directions } of claimedAncestors) {
				const currentClaims = ancestor.childDirectionClaims.get();
				const newClaims = { ...currentClaims };
				let needsUpdate = false;

				for (const dir of directions) {
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
	}, [gestureContext, claimedDirections, currentScreenKey, isTopMostScreen]);
}
