import type { MeasuredDimensions } from "react-native-reanimated";
import type {
	BoundsLink,
	BoundsNavigationZoomOptions,
} from "../../../../types/bounds.types";
import type { Layout } from "../../../../types/screen.types";

type ZoomContentTarget = Exclude<
	BoundsNavigationZoomOptions["target"],
	undefined
>;

export function getZoomContentTarget({
	explicitTarget,
	screenLayout,
	link,
}: {
	explicitTarget: BoundsNavigationZoomOptions["target"];
	screenLayout: Layout;
	link: BoundsLink;
}): ZoomContentTarget {
	"worklet";

	if (explicitTarget !== undefined) {
		return explicitTarget;
	}

	const sourceBounds = link.source?.bounds;
	const screenWidth = screenLayout.width;

	if (!sourceBounds || sourceBounds.width <= 0 || screenWidth <= 0) {
		return "fullscreen";
	}

	const height = (sourceBounds.height / sourceBounds.width) * screenWidth;

	return {
		x: 0,
		y: 0,
		pageX: 0,
		pageY: 0,
		width: screenWidth,
		height,
	};
}

export function resolveZoomTrackingContentTarget({
	contentTarget,
	link,
	screenLayout,
}: {
	contentTarget: ZoomContentTarget;
	link: BoundsLink;
	screenLayout: Layout;
}): MeasuredDimensions | undefined {
	"worklet";

	if (typeof contentTarget === "object") {
		return contentTarget;
	}

	if (contentTarget === "bound") {
		return link.destination?.bounds;
	}

	return {
		x: 0,
		y: 0,
		pageX: 0,
		pageY: 0,
		width: screenLayout.width,
		height: screenLayout.height,
	};
}
