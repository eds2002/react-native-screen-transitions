import type { StyleProps } from "react-native-reanimated";
import { getClampedScrollAxisDelta } from "../../../../../../stores/scroll.store";
import type { ScrollMeasuredDimensions } from "../../../../utils/measured-bounds";
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
	/**
	 * Live correction applied on top of the stored source placement. Used by
	 * cross-screen hosts to keep the landing rect tracking the source screen's
	 * scroll while the source is interactive mid-flight.
	 */
	landingShift?: { x: number; y: number };
};

export const resolvePortalOffsetStyle = ({
	bounds,
	hostKey,
	placement,
	landingShift,
}: ResolvePortalOffsetStyleParams): StyleProps => {
	"worklet";
	const hostBounds = getPortalHostBounds(hostKey);
	const boundsScrollSnapshot = bounds.scroll ?? null;
	const hostBoundsScrollSnapshot = hostBounds?.scroll ?? null;

	// same-screen re-bases the static host frame onto the source scroll snapshot.
	// Cross-screen hosts are the chosen replacement coordinate space, so their
	// destination scroll is represented by where the host itself is mounted.
	const alignHostToBoundsScroll = placement === "same-screen";

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
			{ translateY: bounds.pageY - adjustedHostPageY + (landingShift?.y ?? 0) },
			{ translateX: bounds.pageX - adjustedHostPageX + (landingShift?.x ?? 0) },
		],
	};
};
