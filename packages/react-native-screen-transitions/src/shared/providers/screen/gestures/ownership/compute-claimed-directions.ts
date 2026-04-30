import { DEFAULT_GESTURE_DIRECTION } from "../../../../constants";
import type {
	GestureDirection,
	PanGestureDirection,
} from "../../../../types/gesture.types";
import {
	type ClaimedDirections,
	type Direction,
	NO_CLAIMS,
} from "../../../../types/ownership.types";

/**
 * Computes which directions a screen claims ownership of.
 *
 * A screen claims a direction when:
 * 1. direction claiming is enabled AND
 * 2. gestureDirection includes that direction
 *
 * For snap points, both directions on each configured pan axis are claimed.
 * The first direction on an axis collapses; its inverse expands.
 *
 * @param canClaimDirections - Whether this screen can own gesture directions
 * @param gestureDirection - The gesture direction(s) configured for this screen
 * @param hasSnapPoints - Whether this screen has snap points configured
 * @returns The claimed directions for this screen
 */
export function computeClaimedDirections(
	canClaimDirections: boolean,
	gestureDirection: GestureDirection | GestureDirection[] | undefined,
	hasSnapPoints: boolean,
): ClaimedDirections {
	if (!canClaimDirections) {
		return NO_CLAIMS;
	}

	const direction = gestureDirection ?? DEFAULT_GESTURE_DIRECTION;

	// Normalize to array
	const directions: PanGestureDirection[] = (
		Array.isArray(direction) ? direction : [direction]
	).filter(
		(dir): dir is PanGestureDirection =>
			dir !== "pinch-in" && dir !== "pinch-out",
	);

	if (directions.length === 0) {
		return NO_CLAIMS;
	}

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

	// Snap points own both directions on every configured pan axis.
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
