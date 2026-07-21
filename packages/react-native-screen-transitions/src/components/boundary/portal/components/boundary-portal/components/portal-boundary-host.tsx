import { memo } from "react";
import { type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { NO_STYLES } from "../../../../../../constants";
import { composeSlotStyleWithLocalTransform } from "../../../../../../providers/screen/styles/helpers/compose-slot-style";
import { AnimationStore } from "../../../../../../stores/animation.store";
import { getSourceScreenKeyFromPairKey } from "../../../../../../stores/bounds/helpers/link-pairs.helpers";
import { getLink } from "../../../../../../stores/bounds/internals/links";
import {
	getClampedScrollAxisDelta,
	ScrollStore,
} from "../../../../../../stores/scroll.store";
import type { ScrollMeasuredDimensions } from "../../../../utils/measured-bounds";
import { NativePortalHost, PORTAL_POINTER_EVENTS } from "../../../teleport";
import { hasLocalSlot } from "../helpers/has-local-slot";
import { resolvePortalOffsetStyle } from "../helpers/offset-style";
import type { ActivePortalBoundaryHost } from "../stores/portal-boundary-host.store";

const AnimatedPortalBoundaryHost = NativePortalHost
	? Animated.createAnimatedComponent(NativePortalHost)
	: null;

type PortalBoundaryHostProps = {
	host: ActivePortalBoundaryHost;
	style?: StyleProp<ViewStyle>;
};

export const PortalBoundaryHost = memo(function PortalBoundaryHost({
	host,
	style,
}: PortalBoundaryHostProps) {
	// Cross-screen landing-rect scroll tracking: the flight interpolates toward
	// the source rect stored at measure time, but the source screen stays
	// scrollable while the pair closes (destination pointer events are
	// released). These are read per-frame so the landing point follows the
	// live source scroll instead of the stale snapshot.
	const sourceScrollMetadata = ScrollStore.getValue(
		getSourceScreenKeyFromPairKey(host.pairKey),
		"metadata",
	);
	const hostVisualProgress = AnimationStore.getValue(
		host.screenKey,
		"visualProgress",
	);

	const hostStyle = useAnimatedStyle(() => {
		"worklet";
		// Strict per-member lookup - a fallback member's source rect would
		// misplace this host's teleported content.
		const link = getLink(host.pairKey, host.boundaryId);
		if (!link?.source) {
			return NO_STYLES;
		}

		const sourceBounds = link.source.bounds as ScrollMeasuredDimensions;
		const isCrossScreenPortal = link.source.screenKey !== host.screenKey;

		let landingShift: { x: number; y: number } | undefined;

		if (isCrossScreenPortal) {
			// Weight by distance-to-landing so the destination end of the flight
			// stays pinned: no correction while the content sits over the
			// destination rect (progress 1), full correction at touchdown on the
			// source rect (progress 0).
			const landingWeight =
				1 - Math.min(Math.max(hostVisualProgress.get(), 0), 1);

			if (landingWeight > 0) {
				const liveScroll = sourceScrollMetadata.get();
				const capturedScroll = sourceBounds.scroll ?? null;

				// Scroll offset grows as content moves up/left, so the rect's
				// on-screen position shifts by the negative delta.
				landingShift = {
					x:
						-getClampedScrollAxisDelta(
							liveScroll,
							capturedScroll,
							"horizontal",
						) * landingWeight,
					y:
						-getClampedScrollAxisDelta(liveScroll, capturedScroll, "vertical") *
						landingWeight,
				};
			}
		}

		return resolvePortalOffsetStyle({
			bounds: sourceBounds,
			hostKey: host.hostKey,
			placement: isCrossScreenPortal ? "cross-screen" : "same-screen",
			landingShift,
		});
	});
	const contentFrameStyle = useAnimatedStyle(() => {
		"worklet";
		const link = getLink(host.pairKey, host.boundaryId);
		if (!link?.source) {
			return NO_STYLES;
		}

		const sourceBounds = link.source.bounds as ScrollMeasuredDimensions;

		return {
			height: sourceBounds.height,
			width: sourceBounds.width,
		};
	});
	const slotStyle = useAnimatedStyle(() => {
		"worklet";
		// `slotsMap` is the resolved map: it may contain real interpolator output,
		// inherited styles, or resolver-created reset patches for slots that just
		// disappeared. Normal components need those reset patches so stale styles
		// clear correctly.
		//
		// A screen-level portal host is different. It is only the temporary visual
		// receiver for teleported content, not the original component that needs a
		// cleanup frame. If the current local interpolator layers did not emit this
		// boundary id, any resolved style here is cleanup/stale residue and should
		// not be drawn by the host.
		if (
			host.escapeClipping &&
			!hasLocalSlot(host.localStylesMaps.get(), host.boundaryId)
		) {
			return NO_STYLES;
		}

		const slot = host.slotsMap.get()[host.boundaryId];

		return composeSlotStyleWithLocalTransform(
			slot?.style ?? NO_STYLES,
			undefined,
			slot?.boundsLocalTransform,
		);
	});

	// Without `react-native-teleport` no portal ever mounts a boundary host, so
	// this never renders - the guard just narrows the nullable animated host.
	if (!AnimatedPortalBoundaryHost) {
		return null;
	}

	return (
		<Animated.View
			pointerEvents={PORTAL_POINTER_EVENTS}
			style={[style, hostStyle]}
			collapsable={false}
		>
			<AnimatedPortalBoundaryHost
				name={host.portalHostName}
				pointerEvents={PORTAL_POINTER_EVENTS}
				style={[styles.content, contentFrameStyle, slotStyle]}
			/>
		</Animated.View>
	);
});

const styles = StyleSheet.create({
	content: {
		left: 0,
		position: "absolute",
		top: 0,
	},
});
