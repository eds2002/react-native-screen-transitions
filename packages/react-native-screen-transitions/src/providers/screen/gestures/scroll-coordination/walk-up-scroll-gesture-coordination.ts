import type { SharedValue } from "react-native-reanimated";
import type { Direction } from "../../../../types/ownership.types";
import type {
	PanGesture,
	PinchGesture,
	ScreenGestureSource,
	ScrollGestureAxis,
	ScrollGestureState,
} from "../types";

/** Walks up the gesture tree until it finds the owner for a specific direction. */
function findGestureOwnerForDirection(
	ancestors: readonly ScreenGestureSource[],
	direction: Direction,
): ScreenGestureSource | null {
	for (const ancestor of ancestors) {
		if (ancestor.claimedDirections?.[direction]) return ancestor;
	}

	return null;
}

const getDirectionsForAxis = (
	axis: ScrollGestureAxis,
): readonly [Direction, Direction] =>
	axis === "vertical"
		? ["vertical", "vertical-inverted"]
		: ["horizontal", "horizontal-inverted"];

const collectAncestorPinchGestures = (
	ancestors: readonly ScreenGestureSource[],
) => {
	const pinchGestures: ScreenGestureSource["pinchGesture"][] = [];

	for (const ancestor of ancestors) {
		if (!pinchGestures.includes(ancestor.pinchGesture)) {
			pinchGestures.push(ancestor.pinchGesture);
		}
	}

	return pinchGestures;
};

const collectAxisOwners = (
	ancestors: readonly ScreenGestureSource[],
	directions: readonly [Direction, Direction],
) => {
	const seenOwners: ScreenGestureSource[] = [];
	const panGestures: ScreenGestureSource["panGesture"][] = [];
	const scrollStates: ScreenGestureSource["scrollState"][] = [];
	const ownerRouteKeys: string[] = [];

	for (const direction of directions) {
		const owner = findGestureOwnerForDirection(ancestors, direction);

		if (!owner || seenOwners.includes(owner)) {
			continue;
		}

		seenOwners.push(owner);
		panGestures.push(owner.panGesture);
		scrollStates.push(owner.scrollState);
		ownerRouteKeys.push(owner.routeKey);
	}

	return { panGestures, scrollStates, ownerRouteKeys };
};

interface WalkUpScrollGestureCoordinationResult {
	panGestures: PanGesture[];
	pinchGestures: PinchGesture[];
	scrollStates: SharedValue<ScrollGestureState | null>[];
	ownerRouteKeys: string[];
}

export function walkUpScrollGestureCoordination(
	ancestors: readonly ScreenGestureSource[],
	axis: ScrollGestureAxis,
): WalkUpScrollGestureCoordinationResult {
	const axisOwners = collectAxisOwners(ancestors, getDirectionsForAxis(axis));

	return {
		panGestures: axisOwners.panGestures,
		pinchGestures: collectAncestorPinchGestures(ancestors),
		scrollStates: axisOwners.scrollStates,
		ownerRouteKeys: axisOwners.ownerRouteKeys,
	};
}
