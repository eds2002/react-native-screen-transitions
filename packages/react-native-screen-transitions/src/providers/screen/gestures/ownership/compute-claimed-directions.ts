import { DEFAULT_GESTURE_DIRECTION } from "../../../../constants";
import type {
	GestureDirectionOption,
	PanGestureDirection,
} from "../../../../types/gesture.types";
import {
	type ClaimedDirections,
	type Direction,
	NO_CLAIMS,
} from "../../../../types/ownership.types";
import { getPanGestureDirections } from "../shared/directions";

const createClaimSet = (): ClaimedDirections => ({
	vertical: false,
	"vertical-inverted": false,
	horizontal: false,
	"horizontal-inverted": false,
});

const normalizePanGestureDirections = (
	gestureDirection: GestureDirectionOption | undefined,
) => {
	const direction = gestureDirection ?? DEFAULT_GESTURE_DIRECTION;
	return getPanGestureDirections(direction);
};

const claimPanDirection = (
	claims: ClaimedDirections,
	direction: PanGestureDirection,
) => {
	if (direction === "bidirectional") {
		claims.vertical = true;
		claims["vertical-inverted"] = true;
		claims.horizontal = true;
		claims["horizontal-inverted"] = true;
		return;
	}

	claims[direction as Direction] = true;
};

const expandSnapPointAxisClaims = (claims: ClaimedDirections) => {
	const hasVerticalAxis = claims.vertical || claims["vertical-inverted"];
	const hasHorizontalAxis = claims.horizontal || claims["horizontal-inverted"];

	if (hasVerticalAxis) {
		claims.vertical = true;
		claims["vertical-inverted"] = true;
	}

	if (hasHorizontalAxis) {
		claims.horizontal = true;
		claims["horizontal-inverted"] = true;
	}
};

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
	gestureDirection: GestureDirectionOption | undefined,
	hasSnapPoints: boolean,
): ClaimedDirections {
	if (!canClaimDirections) {
		return NO_CLAIMS;
	}

	const directions = normalizePanGestureDirections(gestureDirection);

	if (directions.length === 0) {
		return NO_CLAIMS;
	}

	const claims = createClaimSet();

	for (const dir of directions) {
		claimPanDirection(claims, dir);
	}

	if (hasSnapPoints) {
		expandSnapPointAxisClaims(claims);
	}

	return claims;
}
