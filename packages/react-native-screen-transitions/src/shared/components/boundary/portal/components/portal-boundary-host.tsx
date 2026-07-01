import { memo } from "react";
import { type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import { getSourceScreenKeyFromPairKey } from "../../../../stores/bounds/helpers/link-pairs.helpers";
import { getLink } from "../../../../stores/bounds/internals/links";
import { ScrollStore } from "../../../../stores/scroll.store";
import type { ScrollMeasuredDimensions } from "../../utils/measured-bounds";
import type { ActivePortalBoundaryHost } from "../stores/portal-boundary-host.store";
import { NativePortalHost } from "../teleport";
import { hasLocalSlot } from "../utils/has-local-slot";
import { resolvePortalOffsetStyle } from "../utils/offset-style";

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
	const sourceScrollMetadata = ScrollStore.getValue(
		getSourceScreenKeyFromPairKey(host.pairKey),
		"metadata",
	);

	const hostStyle = useAnimatedStyle(() => {
		"worklet";
		// Strict per-member lookup — a fallback member's source rect would
		// misplace this host's teleported content.
		const link = getLink(host.pairKey, host.boundaryId);
		if (!link?.source || !link.destination) {
			return NO_STYLES;
		}

		const sourceBounds = link.source.bounds as ScrollMeasuredDimensions;
		const isCrossScreenPortal = link.source.screenKey !== host.screenKey;
		const trackSourceScroll =
			link.source.portalHost !== undefined &&
			isCrossScreenPortal &&
			link.source.sourceHost?.capturesScroll === true;

		return resolvePortalOffsetStyle({
			bounds: sourceBounds,
			hostKey: host.hostKey,
			placement: isCrossScreenPortal ? "cross-screen" : "same-screen",
			sourceCurrentScroll: trackSourceScroll
				? sourceScrollMetadata.get()
				: null,
			trackSourceScroll,
		});
	});
	const contentFrameStyle = useAnimatedStyle(() => {
		"worklet";
		const link = getLink(host.pairKey, host.boundaryId);
		if (!link?.source || !link.destination) {
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
		const link = getLink(host.pairKey, host.boundaryId);
		const isMatchedScreenPortal = link?.source?.portalHost !== undefined;

		// `slotsMap` is the resolved map: it may contain real interpolator output,
		// inherited styles, or resolver-created reset patches for slots that just
		// disappeared. Normal components need those reset patches so stale styles
		// clear correctly.
		//
		// A matched-screen portal host is different. It is only the temporary visual
		// receiver for teleported content, not the original component that needs a
		// cleanup frame. If the current local interpolator layers did not emit this
		// boundary id, any resolved style here is cleanup/stale residue and should
		// not be drawn by the host.
		if (
			isMatchedScreenPortal &&
			!hasLocalSlot(host.localStylesMaps.get(), host.boundaryId)
		) {
			return NO_STYLES;
		}

		return host.slotsMap.get()[host.boundaryId]?.style ?? NO_STYLES;
	});

	// Without `react-native-teleport` no portal ever mounts a boundary host, so
	// this never renders — the guard just narrows the nullable animated host.
	if (!AnimatedPortalBoundaryHost) {
		return null;
	}

	return (
		<Animated.View
			pointerEvents="none"
			style={[style, hostStyle]}
			collapsable={false}
		>
			<AnimatedPortalBoundaryHost
				name={host.portalHostName}
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
