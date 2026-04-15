import type { PanGesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type { Direction } from "../../../../../types/ownership.types";
import type {
	GestureContextType,
	ScrollGestureAxis,
	ScrollGestureState,
} from "../../types";

/** Walks up the gesture tree until it finds the owner for a specific direction. */
function findGestureOwnerForDirection(
	context: GestureContextType | null,
	direction: Direction,
): GestureContextType | null {
	let ancestor = context;

	while (ancestor) {
		if (ancestor.claimedDirections?.[direction]) return ancestor;
		ancestor = ancestor.gestureContext;
	}

	return null;
}

interface WalkUpScrollGestureCoordinationResult {
	panGestures: PanGesture[];
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
	const scrollStates: GestureContextType["scrollState"][] = [];

	for (const direction of directions) {
		const owner = findGestureOwnerForDirection(context, direction);

		if (!owner || seenOwners.includes(owner)) {
			continue;
		}

		seenOwners.push(owner);
		panGestures.push(owner.panGesture);
		scrollStates.push(owner.scrollState);
	}

	return {
		panGestures,
		scrollStates,
	};
}
