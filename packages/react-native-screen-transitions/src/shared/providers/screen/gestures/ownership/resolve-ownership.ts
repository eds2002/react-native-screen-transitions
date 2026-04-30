import type {
	ClaimedDirections,
	Direction,
} from "../../../../types/ownership.types";
import {
	DIRECTIONS,
	type DirectionOwnership,
	NO_OWNERSHIP,
	type OwnershipStatus,
} from "../../../../types/ownership.types";

/**
 * Minimal interface for ancestor context needed for ownership resolution.
 * This allows the function to be used without importing the full GestureContextType.
 */
interface AncestorClaimsContext {
	claimedDirections: ClaimedDirections;
	gestureContext: AncestorClaimsContext | null;
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
 * @param gestureContext - The gesture context chain (can be null if no ancestors)
 * @returns Ownership status for all four directions
 */
export function resolveOwnership(
	selfClaims: ClaimedDirections,
	gestureContext: AncestorClaimsContext | null,
): DirectionOwnership {
	const result: DirectionOwnership = { ...NO_OWNERSHIP };

	for (const direction of DIRECTIONS) {
		result[direction] = resolveDirectionOwnership(
			direction,
			selfClaims,
			gestureContext,
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
	gestureContext: AncestorClaimsContext | null,
): OwnershipStatus {
	// Check self first
	if (selfClaims[direction]) {
		return "self";
	}

	// Walk ancestors looking for a claim
	let ancestor = gestureContext;
	while (ancestor) {
		if (ancestor.claimedDirections?.[direction]) {
			return "ancestor";
		}
		ancestor = ancestor.gestureContext;
	}

	// No one claims this direction
	return "none";
}
