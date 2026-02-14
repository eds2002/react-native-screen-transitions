import type { GestureDirection } from "../../types/gesture.types";
import {
	type ClaimedDirections,
	type Direction,
	NO_CLAIMS,
} from "../../types/ownership.types";

/**
 * Computes which directions a screen claims ownership of.
 *
 * A screen claims a direction when:
 * 1. gestureEnabled is true AND
 * 2. gestureDirection includes that direction
 *
 * For snap points, both directions on the axis are claimed automatically.
 * This is because a snap point sheet handles both expand (inverse) and collapse (primary) gestures.
 *
 * @param gestureEnabled - Whether gestures are enabled for this screen
 * @param gestureDirection - The gesture direction(s) configured for this screen
 * @param hasSnapPoints - Whether this screen has snap points configured
 * @returns The claimed directions for this screen
 */
export function computeClaimedDirections(
	gestureEnabled: boolean,
	gestureDirection: GestureDirection | GestureDirection[] | undefined,
	hasSnapPoints: boolean,
): ClaimedDirections {
	// If gestures are not enabled, claim nothing
	if (!gestureEnabled) {
		return NO_CLAIMS;
	}

	// Default to vertical if no direction specified
	const direction = gestureDirection ?? "vertical";

	// Normalize to array
	const directions: GestureDirection[] = Array.isArray(direction)
		? direction
		: [direction];

	// Start with no claims
	const claims: ClaimedDirections = {
		vertical: false,
		"vertical-inverted": false,
		horizontal: false,
		"horizontal-inverted": false,
	};

	// Process each direction
	for (const dir of directions) {
		if (dir === "bidirectional") {
			// Bidirectional claims all four directions
			claims.vertical = true;
			claims["vertical-inverted"] = true;
			claims.horizontal = true;
			claims["horizontal-inverted"] = true;
		} else {
			// Claim the specific direction
			claims[dir as Direction] = true;
		}
	}

	// For snap points, claim both directions on the axis
	// This enables both expand (inverse) and collapse/dismiss (primary) gestures
	if (hasSnapPoints) {
		const hasVerticalAxis = claims.vertical || claims["vertical-inverted"];
		const hasHorizontalAxis =
			claims.horizontal || claims["horizontal-inverted"];

		if (hasVerticalAxis) {
			claims.vertical = true;
			claims["vertical-inverted"] = true;
		}
		if (hasHorizontalAxis) {
			claims.horizontal = true;
			claims["horizontal-inverted"] = true;
		}
	}

	return claims;
}

/**
 * Checks if any direction is claimed.
 */
export function claimsAnyDirection(claims: ClaimedDirections): boolean {
	return (
		claims.vertical ||
		claims["vertical-inverted"] ||
		claims.horizontal ||
		claims["horizontal-inverted"]
	);
}
