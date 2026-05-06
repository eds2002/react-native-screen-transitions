import type {
	ActiveGesture,
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

interface GetPanActivationDirectionsProps {
	gestureDirection: GestureDirection | GestureDirection[];
	hasSnapPoints: boolean;
}

const isPinchGestureDirection = (
	direction: GestureDirection,
): direction is PinchGestureDirection => {
	"worklet";
	return direction === "pinch-in" || direction === "pinch-out";
};

const isPanGestureDirection = (
	direction: GestureDirection,
): direction is PanGestureDirection => {
	"worklet";
	return !isPinchGestureDirection(direction);
};

export const isResolvedPanGestureDirection = (
	gesture: ActiveGesture | null,
): gesture is ResolvedPanGestureDirection => {
	"worklet";
	return (
		gesture === "horizontal" ||
		gesture === "horizontal-inverted" ||
		gesture === "vertical" ||
		gesture === "vertical-inverted"
	);
};

export const getPanGestureDirections = (
	gestureDirection: GestureDirection | GestureDirection[],
): PanGestureDirection[] => {
	"worklet";
	const directions = Array.isArray(gestureDirection)
		? gestureDirection
		: [gestureDirection];
	const panDirections: PanGestureDirection[] = [];

	for (const direction of directions) {
		if (isPanGestureDirection(direction)) {
			panDirections.push(direction);
		}
	}

	return panDirections;
};

export const getPinchGestureDirections = (
	gestureDirection: GestureDirection | GestureDirection[],
): PinchGestureDirection[] => {
	"worklet";
	const directions = Array.isArray(gestureDirection)
		? gestureDirection
		: [gestureDirection];
	const pinchDirections: PinchGestureDirection[] = [];

	for (const direction of directions) {
		if (isPinchGestureDirection(direction)) {
			pinchDirections.push(direction);
		}
	}

	return pinchDirections;
};

const getOppositePanDirection = (
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

const getPanDirectionAxis = (
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
	"worklet";
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

export const getPanSnapAxisDirections = (
	gestureDirection: GestureDirection | GestureDirection[],
): SnapPanDirectionConfig => {
	"worklet";
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
	"worklet";
	const pinchDirection = getPinchGestureDirections(gestureDirection)[0];

	if (!pinchDirection) return null;

	return {
		collapse: pinchDirection,
		expand: pinchDirection === "pinch-in" ? "pinch-out" : "pinch-in",
	};
};

export const getPanActivationDirections = ({
	gestureDirection,
	hasSnapPoints,
}: GetPanActivationDirectionsProps): GestureDirections => {
	"worklet";
	const panDirections = getPanGestureDirections(gestureDirection);

	if (hasSnapPoints) {
		const snapAxisDirections = getPanSnapAxisDirections(gestureDirection);

		return {
			vertical: !!snapAxisDirections.vertical,
			verticalInverted: !!snapAxisDirections.vertical,
			horizontal: !!snapAxisDirections.horizontal,
			horizontalInverted: !!snapAxisDirections.horizontal,
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

export const getPanSnapAxisConfigForDirection = (
	snapAxisDirections: SnapPanDirectionConfig,
	direction: Direction,
): { axis: SnapPanAxis; config: SnapPanAxisConfig } | null => {
	"worklet";
	const axis = getPanDirectionAxis(direction);
	const config = snapAxisDirections[axis];

	if (!config) return null;

	return { axis, config };
};
