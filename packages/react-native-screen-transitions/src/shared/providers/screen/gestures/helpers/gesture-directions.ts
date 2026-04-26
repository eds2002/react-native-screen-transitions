import type {
	GestureDirection,
	GestureDirections,
	PanGestureDirection,
	PinchGestureDirection,
	ResolvedPanGestureDirection,
	SnapPanAxis,
	SnapPanAxisConfig,
	SnapPanDirectionConfig,
	SnapPinchDirectionConfig,
} from "../../../../types/gesture.types";
import type { Direction } from "../../../../types/ownership.types";

interface GetActivationGestureDirectionsProps {
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

export const getOppositePanDirection = (
	direction: ResolvedPanGestureDirection,
): ResolvedPanGestureDirection => {
	"worklet";
	switch (direction) {
		case "horizontal":
			return "horizontal-inverted";
		case "horizontal-inverted":
			return "horizontal";
		case "vertical":
			return "vertical-inverted";
		case "vertical-inverted":
			return "vertical";
	}
};

export const getPanDirectionAxis = (
	direction: ResolvedPanGestureDirection,
): SnapPanAxis => {
	"worklet";
	return direction === "horizontal" || direction === "horizontal-inverted"
		? "horizontal"
		: "vertical";
};

const setSnapPanAxisConfig = (
	config: SnapPanDirectionConfig,
	direction: ResolvedPanGestureDirection,
) => {
	const axis = getPanDirectionAxis(direction);

	if (config[axis]) return;

	config[axis] = {
		collapse: direction,
		expand: getOppositePanDirection(direction),
		inverted:
			direction === "horizontal-inverted" || direction === "vertical-inverted",
		progressSign:
			direction === "horizontal-inverted" || direction === "vertical-inverted"
				? 1
				: -1,
	};
};

export const getSnapPanDirectionConfig = (
	gestureDirection: GestureDirection | GestureDirection[],
): SnapPanDirectionConfig => {
	const config: SnapPanDirectionConfig = {
		horizontal: null,
		vertical: null,
	};

	for (const direction of getPanGestureDirections(gestureDirection)) {
		if (direction === "bidirectional") {
			setSnapPanAxisConfig(config, "horizontal");
			setSnapPanAxisConfig(config, "vertical");
			continue;
		}

		setSnapPanAxisConfig(config, direction);
	}

	return config;
};

export const getSnapPinchDirectionConfig = (
	gestureDirection: GestureDirection | GestureDirection[],
): SnapPinchDirectionConfig => {
	const pinchDirection = getPinchGestureDirections(gestureDirection)[0];

	if (!pinchDirection) return null;

	return {
		collapse: pinchDirection,
		expand: pinchDirection === "pinch-in" ? "pinch-out" : "pinch-in",
	};
};

export const getActivationGestureDirections = ({
	gestureDirection,
	hasSnapPoints,
}: GetActivationGestureDirectionsProps): GestureDirections => {
	const panDirections = getPanGestureDirections(gestureDirection);

	if (hasSnapPoints) {
		const snapDirections = getSnapPanDirectionConfig(gestureDirection);

		return {
			vertical: !!snapDirections.vertical,
			verticalInverted: !!snapDirections.vertical,
			horizontal: !!snapDirections.horizontal,
			horizontalInverted: !!snapDirections.horizontal,
		};
	}

	const isBidirectional = panDirections.includes("bidirectional");

	return {
		vertical: panDirections.includes("vertical") || isBidirectional,
		verticalInverted:
			panDirections.includes("vertical-inverted") || isBidirectional,
		horizontal: panDirections.includes("horizontal") || isBidirectional,
		horizontalInverted:
			panDirections.includes("horizontal-inverted") || isBidirectional,
	};
};

export const getSnapPanAxisConfigForDirection = (
	snapDirections: SnapPanDirectionConfig,
	direction: Direction,
): { axis: SnapPanAxis; config: SnapPanAxisConfig } | null => {
	"worklet";
	const axis = getPanDirectionAxis(direction);
	const config = snapDirections[axis];

	if (!config) return null;

	return { axis, config };
};

export const isExpandGestureForDirection = (
	swipeDirection: Direction,
	snapDirections: SnapPanDirectionConfig,
): boolean => {
	"worklet";
	const axisConfig = getSnapPanAxisConfigForDirection(
		snapDirections,
		swipeDirection,
	);

	return axisConfig?.config.expand === swipeDirection;
};
