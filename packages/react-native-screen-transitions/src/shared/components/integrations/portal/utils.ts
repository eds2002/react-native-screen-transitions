import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import type { ScrollMetadataState } from "../../../types/gesture.types";
import { getPortalHostBounds } from "./stores/host-bounds.store";

export const PORTAL_HOST_NAME_RESET_VALUE = "--";
const PORTAL_HOST_NAME_SUFFIX = "-portal-host";

export const createPortalBoundaryHostName = (
	hostKey: string,
	boundaryId: string,
) => {
	"worklet";
	return `${hostKey}-${boundaryId}${PORTAL_HOST_NAME_SUFFIX}`;
};

export const createPortalName = (id: string) => {
	"worklet";
	return `${id}-portal`;
};

const getScrollDelta = (
	current: ScrollMetadataState | null,
	measured: ScrollMetadataState | null | undefined,
	axis: "horizontal" | "vertical",
) => {
	"worklet";
	const currentAxis = current?.[axis];
	const measuredAxis = measured?.[axis];

	if (!currentAxis || !measuredAxis) {
		return 0;
	}

	return currentAxis.offset - measuredAxis.offset;
};

type ResolvePortalOffsetStyleParams = {
	bounds: MeasuredDimensions;
	boundsCurrentScroll?: ScrollMetadataState | null;
	currentScroll?: ScrollMetadataState | null;
	hostCurrentScroll?: ScrollMetadataState | null;
	hostKey: string;
	includeScrollOffsets?: boolean;
	position?: "absolute" | "relative";
};

export const resolvePortalOffsetStyle = ({
	bounds,
	boundsCurrentScroll,
	currentScroll,
	hostCurrentScroll,
	hostKey,
	includeScrollOffsets = true,
	position = "relative",
}: ResolvePortalOffsetStyleParams): StyleProps => {
	"worklet";
	const hostBounds = getPortalHostBounds(hostKey);
	const boundsScroll = includeScrollOffsets
		? ((bounds as { scroll?: ScrollMetadataState | null }).scroll ??
			boundsCurrentScroll ??
			currentScroll ??
			null)
		: null;
	const hostBoundsScroll = includeScrollOffsets ? hostBounds?.scroll : null;
	const resolvedHostCurrentScroll =
		hostCurrentScroll ?? boundsScroll ?? hostBoundsScroll ?? null;
	const hostScrollDeltaX = getScrollDelta(
		resolvedHostCurrentScroll,
		hostBoundsScroll,
		"horizontal",
	);
	const hostScrollDeltaY = getScrollDelta(
		resolvedHostCurrentScroll,
		hostBoundsScroll,
		"vertical",
	);
	const adjustedHostPageX = hostBounds
		? hostBounds.pageX - hostScrollDeltaX
		: 0;
	const adjustedHostPageY = hostBounds
		? hostBounds.pageY - hostScrollDeltaY
		: 0;
	const boundsScrollDeltaX = includeScrollOffsets
		? getScrollDelta(currentScroll ?? null, boundsScroll, "horizontal")
		: 0;
	const boundsScrollDeltaY = includeScrollOffsets
		? getScrollDelta(currentScroll ?? null, boundsScroll, "vertical")
		: 0;
	const offsetX = hostBounds
		? bounds.pageX - adjustedHostPageX
		: bounds.pageX - boundsScrollDeltaX;
	const offsetY = hostBounds
		? bounds.pageY - adjustedHostPageY
		: bounds.pageY - boundsScrollDeltaY;
	const transform = [{ translateY: offsetY }, { translateX: offsetX }];

	if (position === "absolute") {
		return {
			left: 0,
			position: "absolute",
			top: 0,
			transform,
		};
	}

	return {
		transform,
	};
};
