import {
	interpolate,
	type MeasuredDimensions,
	type StyleProps,
} from "react-native-reanimated";
import { getClampedScrollAxisDelta } from "../../../../stores/scroll.store";
import type { ScrollMetadataState } from "../../../../types/gesture.types";
import { getPortalHostBounds } from "../stores/host-bounds.store";

export type PortalOffsetPlacement =
	| "same-screen"
	| "cross-screen-open"
	| "cross-screen-close";

type ResolvePortalOffsetStyleParams = {
	alignHostToBoundsScroll?: boolean;
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
	/**
	 * The three portal coordinate cases we support:
	 *
	 * - same-screen: source and host are on the same screen; align the stored
	 *   host frame to the source measurement's scroll snapshot once.
	 * - cross-screen-open: source and host are on different screens; host
	 *   placement is static during the open/idle portion.
	 * - cross-screen-close: source and host are on different screens; the
	 *   dismissal needs the host's live scroll frame until the portal detaches.
	 */
	placement?: PortalOffsetPlacement;
	position?: "absolute" | "relative";
	sourceCurrentScroll?: ScrollMetadataState | null;
	trackSourceScroll?: boolean;
};

export const resolvePortalOffsetStyle = ({
	alignHostToBoundsScroll = false,
	bounds,
	boundsCurrentScroll,
	compensateSourceScroll = false,
	currentScroll,
	hostCurrentScroll,
	hostKey,
	hostProgress = 0,
	includeScrollOffsets = true,
	placement,
	position = "relative",
	sourceCurrentScroll,
	trackSourceScroll = false,
}: ResolvePortalOffsetStyleParams): StyleProps => {
	"worklet";
	const hostBounds = getPortalHostBounds(hostKey);
	const shouldAlignHostToBoundsScroll = placement
		? placement === "same-screen"
		: alignHostToBoundsScroll;
	const shouldCompensateSourceScroll =
		trackSourceScroll || compensateSourceScroll;
	const shouldIncludeHostScrollOffsets = placement
		? placement === "cross-screen-close"
		: includeScrollOffsets;
	const boundsScrollSnapshot =
		(bounds as { scroll?: ScrollMetadataState | null }).scroll ?? null;
	const sourceScrollSnapshot = shouldCompensateSourceScroll
		? boundsScrollSnapshot
		: null;
	const sourceScrollDeltaX = shouldCompensateSourceScroll
		? getClampedScrollAxisDelta(
				sourceCurrentScroll ?? null,
				sourceScrollSnapshot,
				"horizontal",
			)
		: 0;
	const sourceScrollDeltaY = shouldCompensateSourceScroll
		? getClampedScrollAxisDelta(
				sourceCurrentScroll ?? null,
				sourceScrollSnapshot,
				"vertical",
			)
		: 0;
	const sourcePageX = bounds.pageX - sourceScrollDeltaX;
	const sourcePageY = bounds.pageY - sourceScrollDeltaY;
	const boundsScroll = shouldIncludeHostScrollOffsets
		? (boundsScrollSnapshot ?? boundsCurrentScroll ?? currentScroll ?? null)
		: null;
	const hostBoundsScrollSnapshot = hostBounds?.scroll ?? null;
	const hostBoundsScroll = shouldIncludeHostScrollOffsets
		? hostBoundsScrollSnapshot
		: null;
	const resolvedHostCurrentScroll =
		hostCurrentScroll ?? boundsScroll ?? hostBoundsScroll ?? null;
	const hostSnapshotDeltaX =
		shouldAlignHostToBoundsScroll && !shouldIncludeHostScrollOffsets
			? getClampedScrollAxisDelta(
					boundsScrollSnapshot,
					hostBoundsScrollSnapshot,
					"horizontal",
				)
			: 0;
	const hostSnapshotDeltaY =
		shouldAlignHostToBoundsScroll && !shouldIncludeHostScrollOffsets
			? getClampedScrollAxisDelta(
					boundsScrollSnapshot,
					hostBoundsScrollSnapshot,
					"vertical",
				)
			: 0;
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
			hostSnapshotDeltaX -
			interpolate(hostProgress, [0, 1], [hostScrollDeltaX, 0])
		: 0;
	const adjustedHostPageY = hostBounds
		? hostBounds.pageY -
			hostSnapshotDeltaY -
			interpolate(hostProgress, [0, 1], [hostScrollDeltaY, 0])
		: 0;
	const boundsScrollDeltaX = shouldIncludeHostScrollOffsets
		? getClampedScrollAxisDelta(
				currentScroll ?? null,
				boundsScroll,
				"horizontal",
			)
		: 0;
	const boundsScrollDeltaY = shouldIncludeHostScrollOffsets
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
