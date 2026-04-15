import type {
	GestureDirection,
	GestureDirections,
	PanGestureDirection,
	PinchGestureDirection,
} from "../../../../types/gesture.types";
import type { Direction } from "../../../../types/ownership.types";
import { logger } from "../../../../utils/logger";

interface ResolveGestureDirectionsProps {
	gestureDirection: GestureDirection | GestureDirection[];
	hasSnapPoints: boolean;
}

export const isPinchGestureDirection = (
	direction: GestureDirection,
): direction is PinchGestureDirection => {
	return direction === "pinch-in" || direction === "pinch-out";
};

export const isPanGestureDirection = (
	direction: GestureDirection,
): direction is PanGestureDirection => {
	return !isPinchGestureDirection(direction);
};

export const getPanGestureDirections = (
	gestureDirection: GestureDirection | GestureDirection[],
): PanGestureDirection[] => {
	const directions = Array.isArray(gestureDirection)
		? gestureDirection
		: [gestureDirection];

	return directions.filter(isPanGestureDirection);
};

export const getPinchGestureDirections = (
	gestureDirection: GestureDirection | GestureDirection[],
): PinchGestureDirection[] => {
	const directions = Array.isArray(gestureDirection)
		? gestureDirection
		: [gestureDirection];

	return directions.filter(isPinchGestureDirection);
};

export const warnOnSnapDirectionArray = ({
	gestureDirection,
	hasSnapPoints,
}: ResolveGestureDirectionsProps) => {
	const panDirections = getPanGestureDirections(gestureDirection);

	if (!hasSnapPoints || panDirections.length <= 1) return;

	logger.warn(
		`gestureDirection array is not supported with snapPoints. ` +
			`Only the first pan direction "${panDirections[0]}" will be used. ` +
			`Snap points define a single axis of movement, so only one gesture direction is needed.`,
	);
};

export const resolveGestureDirections = ({
	gestureDirection,
	hasSnapPoints,
}: ResolveGestureDirectionsProps): GestureDirections => {
	const panDirections = getPanGestureDirections(gestureDirection);
	const firstPanDirection = panDirections[0];
	const effectiveDirection = hasSnapPoints ? firstPanDirection : panDirections;

	const directionsArray = Array.isArray(effectiveDirection)
		? effectiveDirection
		: effectiveDirection
			? [effectiveDirection]
			: [];

	const isBidirectional = directionsArray.includes("bidirectional");

	const hasHorizontalDirection =
		directionsArray.includes("horizontal") ||
		directionsArray.includes("horizontal-inverted");

	const isSnapAxisInverted = hasHorizontalDirection
		? directionsArray.includes("horizontal-inverted") &&
			!directionsArray.includes("horizontal")
		: directionsArray.includes("vertical-inverted") &&
			!directionsArray.includes("vertical");

	const enableBothVertical =
		isBidirectional || (hasSnapPoints && !hasHorizontalDirection);
	const enableBothHorizontal =
		isBidirectional || (hasSnapPoints && hasHorizontalDirection);

	return {
		vertical: directionsArray.includes("vertical") || enableBothVertical,
		verticalInverted:
			directionsArray.includes("vertical-inverted") || enableBothVertical,
		horizontal: directionsArray.includes("horizontal") || enableBothHorizontal,
		horizontalInverted:
			directionsArray.includes("horizontal-inverted") || enableBothHorizontal,
		snapAxisInverted: hasSnapPoints && isSnapAxisInverted,
	};
};

export const getSnapAxis = (
	directions: GestureDirections,
): "horizontal" | "vertical" => {
	return directions.horizontal || directions.horizontalInverted
		? "horizontal"
		: "vertical";
};

export const isExpandGestureForDirection = (
	swipeDirection: Direction,
	snapAxis: "horizontal" | "vertical",
	snapAxisInverted: boolean,
): boolean => {
	"worklet";
	if (snapAxis === "horizontal") {
		return snapAxisInverted
			? swipeDirection === "horizontal"
			: swipeDirection === "horizontal-inverted";
	}

	return snapAxisInverted
		? swipeDirection === "vertical"
		: swipeDirection === "vertical-inverted";
};
