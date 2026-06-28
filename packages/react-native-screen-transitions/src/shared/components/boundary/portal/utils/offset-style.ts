import type { StyleProps } from "react-native-reanimated";
import { getClampedScrollAxisDelta } from "../../../../stores/scroll.store";
import type { ScrollMetadataState } from "../../../../types/gesture.types";
import type { ScrollMeasuredDimensions } from "../../utils/measured-bounds";
import { getPortalHostBounds } from "../stores/host-bounds.store";

/**
 * The two portal coordinate cases we support:
 *
 * - same-screen: source and host live on the same screen; re-base the stored
 *   host frame onto the source measurement's scroll snapshot.
 * - cross-screen: source and host live on different screens; the host is the
 *   replacement coordinate space, so destination scroll is inherited naturally
 *   from host placement instead of manually propagated.
 */
export type PortalOffsetPlacement = "same-screen" | "cross-screen";

type ResolvePortalOffsetStyleParams = {
	/** Source rect, carrying the scroll snapshot taken at measure time. */
	bounds: ScrollMeasuredDimensions;
	hostKey: string;
	placement: PortalOffsetPlacement;
	/** Live scroll of the source's own scroll host; only read when tracking. */
	sourceCurrentScroll?: ScrollMetadataState | null;
	/**
	 * Express the source rect in its scroll host's live frame: shift it by the
	 * clamped travel of `sourceCurrentScroll` since the snapshot on `bounds`.
	 * This is the only live scroll propagation portals perform.
	 */
	trackSourceScroll?: boolean;
};

export const resolvePortalOffsetStyle = ({
	bounds,
	hostKey,
	placement,
	sourceCurrentScroll,
	trackSourceScroll = false,
}: ResolvePortalOffsetStyleParams): StyleProps => {
	"worklet";
	const hostBounds = getPortalHostBounds(hostKey);
	const boundsScrollSnapshot = bounds.scroll ?? null;
	const hostBoundsScrollSnapshot = hostBounds?.scroll ?? null;

	// same-screen re-bases the static host frame onto the source scroll snapshot.
	// Cross-screen hosts are the chosen replacement coordinate space, so their
	// destination scroll is represented by where the host itself is mounted.
	const alignHostToBoundsScroll = placement === "same-screen";

	// Shift the source rect by how far its own scroll host has travelled since
	// measurement, so the return landing point stays on the live placeholder.
	const sourceScrollDeltaX = trackSourceScroll
		? getClampedScrollAxisDelta(
				sourceCurrentScroll ?? null,
				boundsScrollSnapshot,
				"horizontal",
			)
		: 0;
	const sourceScrollDeltaY = trackSourceScroll
		? getClampedScrollAxisDelta(
				sourceCurrentScroll ?? null,
				boundsScrollSnapshot,
				"vertical",
			)
		: 0;
	const sourcePageX = bounds.pageX - sourceScrollDeltaX;
	const sourcePageY = bounds.pageY - sourceScrollDeltaY;

	const hostSnapshotDeltaX = alignHostToBoundsScroll
		? getClampedScrollAxisDelta(
				boundsScrollSnapshot,
				hostBoundsScrollSnapshot,
				"horizontal",
			)
		: 0;
	const hostSnapshotDeltaY = alignHostToBoundsScroll
		? getClampedScrollAxisDelta(
				boundsScrollSnapshot,
				hostBoundsScrollSnapshot,
				"vertical",
			)
		: 0;

	// Without registered host bounds the host frame is the origin, so the source
	// page position becomes the offset directly.
	const adjustedHostPageX = hostBounds
		? hostBounds.pageX - hostSnapshotDeltaX
		: 0;
	const adjustedHostPageY = hostBounds
		? hostBounds.pageY - hostSnapshotDeltaY
		: 0;

	return {
		transform: [
			{ translateY: sourcePageY - adjustedHostPageY },
			{ translateX: sourcePageX - adjustedHostPageX },
		],
	};
};
