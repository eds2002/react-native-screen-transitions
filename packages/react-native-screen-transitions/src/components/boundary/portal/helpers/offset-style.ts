import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";

type ResolvePortalOffsetStyleParams = {
	bounds: MeasuredDimensions;
	hostBounds: MeasuredDimensions | null;
	/** How far the boundary's scroll views moved since it was measured, minus the host's. */
	scrollDeltaX?: number;
	scrollDeltaY?: number;
};

export const resolvePortalOffsetStyle = ({
	bounds,
	hostBounds,
	scrollDeltaX = 0,
	scrollDeltaY = 0,
}: ResolvePortalOffsetStyleParams): StyleProps => {
	"worklet";
	// Both values are measured in page coordinates. Subtracting the host origin
	// gives the boundary's local position inside that host, independent of which
	// scroll container owns either view. Scrolling since then moves the boundary's
	// placeholder natively; the escaped frame follows by the same distance.
	const hostPageX = hostBounds?.pageX ?? 0;
	const hostPageY = hostBounds?.pageY ?? 0;

	return {
		transform: [
			{ translateY: bounds.pageY - hostPageY - scrollDeltaY },
			{ translateX: bounds.pageX - hostPageX - scrollDeltaX },
		],
	};
};
