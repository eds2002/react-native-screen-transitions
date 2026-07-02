import type { StyleProps } from "react-native-reanimated";
import { getClampedScrollAxisDelta } from "../../../../stores/scroll.store";
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
};

export const resolvePortalOffsetStyle = ({
	bounds,
	hostKey,
	placement,
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
			{ translateY: bounds.pageY - adjustedHostPageY },
			{ translateX: bounds.pageX - adjustedHostPageX },
		],
	};
};
