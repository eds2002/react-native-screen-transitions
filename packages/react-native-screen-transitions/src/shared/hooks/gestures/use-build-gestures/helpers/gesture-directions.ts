import type {
	GestureDirection,
	GestureDirections,
} from "../../../../types/gesture.types";
import type { Direction } from "../../../../types/ownership.types";
import { logger } from "../../../../utils/logger";

interface ResolveGestureDirectionsProps {
	gestureDirection: GestureDirection | GestureDirection[];
	hasSnapPoints: boolean;
}

export const warnOnSnapDirectionArray = ({
	gestureDirection,
	hasSnapPoints,
}: ResolveGestureDirectionsProps) => {
	if (!hasSnapPoints || !Array.isArray(gestureDirection)) return;

	logger.warn(
		`gestureDirection array is not supported with snapPoints. ` +
			`Only the first direction "${gestureDirection[0]}" will be used. ` +
			`Snap points define a single axis of movement, so only one gesture direction is needed.`,
	);
};

export const resolveGestureDirections = ({
	gestureDirection,
	hasSnapPoints,
}: ResolveGestureDirectionsProps): GestureDirections => {
	const effectiveDirection = hasSnapPoints
		? Array.isArray(gestureDirection)
			? gestureDirection[0]
			: gestureDirection
		: gestureDirection;

	const directionsArray = Array.isArray(effectiveDirection)
		? effectiveDirection
		: [effectiveDirection];

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

export const clampVelocity = (value: number, maxMagnitude: number) => {
	"worklet";
	const max = Math.max(0, Math.abs(maxMagnitude));
	return Math.max(-max, Math.min(max, value));
};
