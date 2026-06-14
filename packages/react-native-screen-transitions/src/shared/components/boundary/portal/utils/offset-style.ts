import {
	interpolate,
	type MeasuredDimensions,
	type StyleProps,
} from "react-native-reanimated";
import { getClampedScrollAxisDelta } from "../../../../stores/scroll.store";
import type { ScrollMetadataState } from "../../../../types/gesture.types";
import { getPortalHostBounds } from "../stores/host-bounds.store";

type ResolvePortalOffsetStyleParams = {
	bounds: MeasuredDimensions;
	boundsCurrentScroll?: ScrollMetadataState | null;
	/**
	 * Express the source rect in its scroll host's live frame: the rect is
	 * shifted by the clamped travel of `sourceCurrentScroll` since the scroll
	 * snapshot stored on `bounds`. Independent of the host scroll fallback
	 * chain below — that chain compensates the attached host's own scrolling.
	 */
	compensateSourceScroll?: boolean;
	currentScroll?: ScrollMetadataState | null;
	hostCurrentScroll?: ScrollMetadataState | null;
	hostKey: string;
	hostProgress?: number;
	includeScrollOffsets?: boolean;
	position?: "absolute" | "relative";
	sourceCurrentScroll?: ScrollMetadataState | null;
};

export const resolvePortalOffsetStyle = ({
	bounds,
	boundsCurrentScroll,
	compensateSourceScroll = false,
	currentScroll,
	hostCurrentScroll,
	hostKey,
	hostProgress = 0,
	includeScrollOffsets = true,
	position = "relative",
	sourceCurrentScroll,
}: ResolvePortalOffsetStyleParams): StyleProps => {
	"worklet";
	const hostBounds = getPortalHostBounds(hostKey);
	const sourceScrollSnapshot = compensateSourceScroll
		? ((bounds as { scroll?: ScrollMetadataState | null }).scroll ?? null)
		: null;
	const sourceScrollDeltaX = compensateSourceScroll
		? getClampedScrollAxisDelta(
				sourceCurrentScroll ?? null,
				sourceScrollSnapshot,
				"horizontal",
			)
		: 0;
	const sourceScrollDeltaY = compensateSourceScroll
		? getClampedScrollAxisDelta(
				sourceCurrentScroll ?? null,
				sourceScrollSnapshot,
				"vertical",
			)
		: 0;
	const sourcePageX = bounds.pageX - sourceScrollDeltaX;
	const sourcePageY = bounds.pageY - sourceScrollDeltaY;
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
		? hostBounds.pageX -
			interpolate(hostProgress, [0, 1], [hostScrollDeltaX, 0])
		: 0;
	const adjustedHostPageY = hostBounds
		? hostBounds.pageY -
			interpolate(hostProgress, [0, 1], [hostScrollDeltaY, 0])
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
		? sourcePageX - adjustedHostPageX
		: sourcePageX - boundsScrollDeltaX;
	const offsetY = hostBounds
		? sourcePageY - adjustedHostPageY
		: sourcePageY - boundsScrollDeltaY;
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
