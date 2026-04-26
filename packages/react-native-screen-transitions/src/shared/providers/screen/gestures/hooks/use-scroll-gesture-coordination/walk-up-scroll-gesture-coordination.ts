import type { SharedValue } from "react-native-reanimated";
import type { Direction } from "../../../../../types/ownership.types";
import { walkGestureAncestors } from "../../helpers/walk-gesture-ancestors";
import type {
	GestureContextType,
	PanGesture,
	PinchGesture,
	ScrollGestureAxis,
	ScrollGestureState,
} from "../../types";

/** Walks up the gesture tree until it finds the owner for a specific direction. */
function findGestureOwnerForDirection(
	ancestors: GestureContextType[],
	direction: Direction,
): GestureContextType | null {
	for (const ancestor of ancestors) {
		if (ancestor.claimedDirections?.[direction]) return ancestor;
	}

	return null;
}

interface WalkUpScrollGestureCoordinationResult {
	panGestures: PanGesture[];
	pinchGestures: PinchGesture[];
	scrollStates: SharedValue<ScrollGestureState | null>[];
}

export function walkUpScrollGestureCoordination(
	context: GestureContextType | null,
	axis: ScrollGestureAxis,
): WalkUpScrollGestureCoordinationResult {
	const directions: readonly [Direction, Direction] =
		axis === "vertical"
			? ["vertical", "vertical-inverted"]
			: ["horizontal", "horizontal-inverted"];

	const seenOwners: GestureContextType[] = [];
	const panGestures: GestureContextType["panGesture"][] = [];
	const pinchGestures: GestureContextType["pinchGesture"][] = [];
	const scrollStates: GestureContextType["scrollState"][] = [];
	const ancestors = walkGestureAncestors(context, context?.isIsolated);

	for (const ancestor of ancestors) {
		if (!pinchGestures.includes(ancestor.pinchGesture)) {
			pinchGestures.push(ancestor.pinchGesture);
		}
	}

	for (const direction of directions) {
		const owner = findGestureOwnerForDirection(ancestors, direction);

		if (!owner || seenOwners.includes(owner)) {
			continue;
		}

		seenOwners.push(owner);
		panGestures.push(owner.panGesture);
		scrollStates.push(owner.scrollState);
	}

	return {
		panGestures,
		pinchGestures,
		scrollStates,
	};
}
