import type { ClaimedDirections, Direction } from "../../types/ownership.types";
import {
	DIRECTIONS,
	type DirectionOwnership,
	NO_OWNERSHIP,
	type OwnershipStatus,
} from "../../types/ownership.types";

/**
 * Minimal interface for ancestor context needed for ownership resolution.
 * This allows the function to be used without importing the full GestureContextType.
 */
export interface AncestorClaimsContext {
	claimedDirections: ClaimedDirections;
	ancestorContext: AncestorClaimsContext | null;
}

/**
 * Resolves ownership status for all directions relative to the current screen.
 *
 * For each direction:
 * 1. If the current screen claims it → 'self' (should activate)
 * 2. Else, walk up ancestors looking for a claim → 'ancestor' (should fail to bubble)
 * 3. If no one claims it → 'none' (should fail, no gesture response)
 *
 * This is computed during render (JS thread) and the result can be safely
 * used in worklets since it's a plain object.
 *
 * @param selfClaims - The directions claimed by the current screen
 * @param ancestorContext - The ancestor context chain (can be null if no ancestors)
 * @returns Ownership status for all four directions
 */
export function resolveOwnership(
	selfClaims: ClaimedDirections,
	ancestorContext: AncestorClaimsContext | null,
): DirectionOwnership {
	const result: DirectionOwnership = { ...NO_OWNERSHIP };

	for (const direction of DIRECTIONS) {
		result[direction] = resolveDirectionOwnership(
			direction,
			selfClaims,
			ancestorContext,
		);
	}

	return result;
}

/**
 * Resolves ownership for a single direction.
 */
function resolveDirectionOwnership(
	direction: Direction,
	selfClaims: ClaimedDirections,
	ancestorContext: AncestorClaimsContext | null,
): OwnershipStatus {
	// Check self first
	if (selfClaims[direction]) {
		return "self";
	}

	// Walk ancestors looking for a claim
	let ancestor = ancestorContext;
	while (ancestor) {
		if (ancestor.claimedDirections?.[direction]) {
			return "ancestor";
		}
		ancestor = ancestor.ancestorContext;
	}

	// No one claims this direction
	return "none";
}

/**
 * Finds the nearest ancestor (or self if isCurrentOwner) that claims any direction.
 * Used for setting up native gesture relationships.
 *
 * @param selfClaimsAny - Whether the current screen claims any direction
 * @param ancestorContext - The ancestor context chain
 * @returns The nearest context that claims a direction, or null
 */
export function findNearestOwner(
	selfClaimsAny: boolean,
	ancestorContext: AncestorClaimsContext | null,
): AncestorClaimsContext | null {
	// If self claims any direction, self is the nearest owner
	// (but we return null since this is used for finding ANCESTOR owners)
	if (selfClaimsAny) {
		return null;
	}

	// Walk ancestors looking for one that claims any direction
	let ancestor = ancestorContext;
	while (ancestor) {
		const claims = ancestor.claimedDirections;
		if (
			claims?.vertical ||
			claims?.["vertical-inverted"] ||
			claims?.horizontal ||
			claims?.["horizontal-inverted"]
		) {
			return ancestor;
		}
		ancestor = ancestor.ancestorContext;
	}

	return null;
}
