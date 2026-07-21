import type { MeasuredDimensions } from "react-native-reanimated";
import type {
	BoundsLink,
	BoundsNavigationZoomOptions,
} from "../../../../types/bounds.types";
import type { Layout } from "../../../../types/screen.types";
import type { BoundsAnchor } from "../../types/options";

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
	const screenHeight = screenLayout.height;

	if (
		!sourceBounds ||
		sourceBounds.width <= 0 ||
		sourceBounds.height <= 0 ||
		screenWidth <= 0 ||
		screenHeight <= 0
	) {
		return "fullscreen";
	}

	const sourceAspectRatio = sourceBounds.width / sourceBounds.height;
	const screenAspectRatio = screenWidth / screenHeight;

	// Zoom keeps one edge of the virtual destination attached to the source.
	// A wide source fills the destination width and follows its top edge. A
	// narrow source fills the destination height instead, so it follows the
	// destination's leading edge rather than taking a long vertical path.
	if (sourceAspectRatio < screenAspectRatio) {
		return {
			x: 0,
			y: 0,
			pageX: 0,
			pageY: 0,
			width: (sourceBounds.width / sourceBounds.height) * screenHeight,
			height: screenHeight,
		};
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

export function getZoomContentAnchor({
	explicitTarget,
	screenLayout,
	link,
}: {
	explicitTarget: BoundsNavigationZoomOptions["target"];
	screenLayout: Layout;
	link: BoundsLink;
}): BoundsAnchor {
	"worklet";

	if (explicitTarget !== undefined) {
		return explicitTarget === "bound" ? "center" : "top";
	}

	const sourceBounds = link.source?.bounds;
	if (
		!sourceBounds ||
		sourceBounds.width <= 0 ||
		sourceBounds.height <= 0 ||
		screenLayout.width <= 0 ||
		screenLayout.height <= 0
	) {
		return "top";
	}

	return sourceBounds.width / sourceBounds.height <
		screenLayout.width / screenLayout.height
		? "leading"
		: "top";
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
