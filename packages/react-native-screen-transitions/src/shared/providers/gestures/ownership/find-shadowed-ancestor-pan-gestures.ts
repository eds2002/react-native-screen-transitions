import type { GestureType } from "react-native-gesture-handler";
import {
	type ClaimedDirections,
	DIRECTIONS,
} from "../../../types/ownership.types";
import type { GestureContextType } from "../types";

/**
 * Finds ancestor pan gestures shadowed by the current screen.
 * A child that claims the same direction should block those ancestor gestures.
 */
export function findShadowedAncestorPanGestures(
	selfClaims: ClaimedDirections,
	ancestorContext: GestureContextType | null | undefined,
): GestureType[] {
	const shadowedGestures: GestureType[] = [];
	let ancestor = ancestorContext;

	while (ancestor) {
		const shadowsAncestor = DIRECTIONS.some(
			(dir) => selfClaims[dir] && ancestor?.claimedDirections?.[dir],
		);

		if (shadowsAncestor && ancestor.panGesture) {
			shadowedGestures.push(ancestor.panGesture);
		}

		ancestor = ancestor.ancestorContext;
	}

	return shadowedGestures;
}
