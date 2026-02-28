import { useEffect } from "react";
import { GestureStore } from "../../../stores/gesture.store";
import {
	type ClaimedDirections,
	DIRECTIONS,
	type Direction,
} from "../../../types/ownership.types";
import type { GestureContextType } from "../types";

/**
 * Registers direction claims on ancestors that this screen shadows.
 * Only registers claims when this screen is the current (topmost) route
 * in its navigator, preventing unfocused screens from blocking gestures.
 */
export function useRegisterDirectionClaims(
	ancestorContext: GestureContextType | null | undefined,
	claimedDirections: ClaimedDirections,
	routeKey: string,
	isIsolated: boolean,
	isCurrentRoute: boolean,
) {
	useEffect(() => {
		// Only register claims when this screen is the current route
		if (!isCurrentRoute || !ancestorContext) {
			return;
		}

		const gestureValues = GestureStore.getRouteGestures(routeKey);
		const isDismissing = gestureValues.dismissing;

		const claimedAncestors: Array<{
			ancestor: GestureContextType;
			directions: Direction[];
		}> = [];

		let ancestor: GestureContextType | null = ancestorContext;
		while (ancestor) {
			if (ancestor.isIsolated !== isIsolated) break;

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
					newClaims[dir] = { routeKey, isDismissing };
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
					if (currentClaims[dir]?.routeKey === routeKey) {
						newClaims[dir] = null;
						needsUpdate = true;
					}
				}

				if (needsUpdate) {
					ancestor.childDirectionClaims.value = newClaims;
				}
			}
		};
	}, [
		ancestorContext,
		claimedDirections,
		routeKey,
		isIsolated,
		isCurrentRoute,
	]);
}
