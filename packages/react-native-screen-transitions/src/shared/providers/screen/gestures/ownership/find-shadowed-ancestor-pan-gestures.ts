import type { PanGesture } from "react-native-gesture-handler";
import {
	type ClaimedDirections,
	DIRECTIONS,
} from "../../../../types/ownership.types";
import type { GestureContextType } from "../types";

/**
 * Finds ancestor pan gestures shadowed by the current screen.
 * A child that claims the same direction should block those ancestor gestures.
 */
export function findShadowedAncestorPanGestures(
	selfClaims: ClaimedDirections,
	gestureContext: GestureContextType | null | undefined,
): PanGesture[] {
	const shadowedGestures: PanGesture[] = [];
	let ancestor = gestureContext;

	while (ancestor) {
		const shadowsAncestor = DIRECTIONS.some(
			(dir) => selfClaims[dir] && ancestor?.claimedDirections?.[dir],
		);

		if (shadowsAncestor && ancestor.panGesture) {
			shadowedGestures.push(ancestor.panGesture);
		}

		ancestor = ancestor.gestureContext;
	}

	return shadowedGestures;
}
