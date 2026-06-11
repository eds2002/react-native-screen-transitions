import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import { getClampedScrollAxisDelta } from "../../../../stores/scroll.store";
import type { ScrollMetadataState } from "../../../../types/gesture.types";
import { getPortalHostBounds } from "../stores/host-bounds.store";

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
	// Deltas are clamped to the layout range: iOS rubber-band offsets are
	// outside the real scroll range and must not become coordinate-space deltas.
	const hostScrollDeltaX = getClampedScrollAxisDelta(
		resolvedHostCurrentScroll,
		hostBoundsScroll,
		"horizontal",
	);
	const hostScrollDeltaY = getClampedScrollAxisDelta(
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
		? getClampedScrollAxisDelta(
				currentScroll ?? null,
				boundsScroll,
				"horizontal",
			)
		: 0;
	const boundsScrollDeltaY = includeScrollOffsets
		? getClampedScrollAxisDelta(currentScroll ?? null, boundsScroll, "vertical")
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
