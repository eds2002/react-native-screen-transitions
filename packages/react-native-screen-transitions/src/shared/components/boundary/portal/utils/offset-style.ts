import { interpolate, type StyleProps } from "react-native-reanimated";
import { getClampedScrollAxisDelta } from "../../../../stores/scroll.store";
import type { ScrollMetadataState } from "../../../../types/gesture.types";
import type { ScrollMeasuredDimensions } from "../../utils/measured-bounds";
import { getPortalHostBounds } from "../stores/host-bounds.store";

/**
 * The three portal coordinate cases we support:
 *
 * - same-screen: source and host live on the same screen; re-base the stored
 *   host frame onto the source measurement's scroll snapshot.
 * - cross-screen-open: source and host live on different screens; host placement
 *   is static during the open/idle portion.
 * - cross-screen-close: source and host live on different screens; the dismissal
 *   folds in the host's live scroll frame until the portal detaches.
 */
export type PortalOffsetPlacement =
	| "same-screen"
	| "cross-screen-open"
	| "cross-screen-close";

type ResolvePortalOffsetStyleParams = {
	/** Source rect, carrying the scroll snapshot taken at measure time. */
	bounds: ScrollMeasuredDimensions;
	hostKey: string;
	placement: PortalOffsetPlacement;
	hostProgress?: number;
	/** Live scroll of the attached host; only read for `cross-screen-close`. */
	hostCurrentScroll?: ScrollMetadataState | null;
	/** Live scroll of the source's own scroll host; only read when tracking. */
	sourceCurrentScroll?: ScrollMetadataState | null;
	/**
	 * Express the source rect in its scroll host's live frame: shift it by the
	 * clamped travel of `sourceCurrentScroll` since the snapshot on `bounds`.
	 * Independent of the attached host's own scroll compensation below.
	 */
	trackSourceScroll?: boolean;
};

export const resolvePortalOffsetStyle = ({
	bounds,
	hostKey,
	placement,
	hostProgress = 0,
	hostCurrentScroll,
	sourceCurrentScroll,
	trackSourceScroll = false,
}: ResolvePortalOffsetStyleParams): StyleProps => {
	"worklet";
	const hostBounds = getPortalHostBounds(hostKey);
	const boundsScrollSnapshot = bounds.scroll ?? null;
	const hostBoundsScrollSnapshot = hostBounds?.scroll ?? null;

	// same-screen re-bases the static host frame onto the source scroll snapshot;
	// only the closing case folds in the host's live scroll travel.
	const alignHostToBoundsScroll = placement === "same-screen";
	const includeHostScrollOffsets = placement === "cross-screen-close";

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

	const hostBoundsScroll = includeHostScrollOffsets
		? hostBoundsScrollSnapshot
		: null;
	const resolvedHostCurrentScroll =
		hostCurrentScroll ??
		(includeHostScrollOffsets ? boundsScrollSnapshot : null) ??
		hostBoundsScroll ??
		null;

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

	// Deltas are clamped to the layout range: iOS rubber-band offsets are outside
	// the real scroll range and must not become coordinate-space deltas.
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

	// Without registered host bounds the host frame is the origin, so the source
	// page position becomes the offset directly.
	const adjustedHostPageX = hostBounds
		? hostBounds.pageX -
			hostSnapshotDeltaX -
			interpolate(hostProgress, [0, 1], [hostScrollDeltaX, 0])
		: 0;
	const adjustedHostPageY = hostBounds
		? hostBounds.pageY -
			hostSnapshotDeltaY -
			interpolate(hostProgress, [0, 1], [hostScrollDeltaY, 0])
		: 0;

	return {
		transform: [
			{ translateY: sourcePageY - adjustedHostPageY },
			{ translateX: sourcePageX - adjustedHostPageX },
		],
	};
};
