import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";

type ResolvePortalOffsetStyleParams = {
	bounds: MeasuredDimensions;
	hostBounds: MeasuredDimensions | null;
};

export const resolvePortalOffsetStyle = ({
	bounds,
	hostBounds,
}: ResolvePortalOffsetStyleParams): StyleProps => {
	"worklet";
	// Both values are measured in page coordinates. Subtracting the host origin
	// gives the boundary's local position inside that host, independent of which
	// scroll container owns either view.
	const hostPageX = hostBounds?.pageX ?? 0;
	const hostPageY = hostBounds?.pageY ?? 0;

	return {
		transform: [
			{ translateY: bounds.pageY - hostPageY },
			{ translateX: bounds.pageX - hostPageX },
		],
	};
};
