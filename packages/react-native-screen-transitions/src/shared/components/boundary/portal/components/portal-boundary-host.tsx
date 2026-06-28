import { memo } from "react";
import { type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import { AnimationStore } from "../../../../stores/animation.store";
import { getSourceScreenKeyFromPairKey } from "../../../../stores/bounds/helpers/link-pairs.helpers";
import { getLink } from "../../../../stores/bounds/internals/links";
import { GestureStore } from "../../../../stores/gesture.store";
import { ScrollStore } from "../../../../stores/scroll.store";
import type { ActivePortalBoundaryHost } from "../stores/portal-boundary-host.store";
import { NativePortalHost } from "../teleport";
import { hasLocalSlot } from "../utils/has-local-slot";
import { createPortalBoundaryHostName } from "../utils/naming";
import {
	type PortalOffsetPlacement,
	resolvePortalOffsetStyle,
} from "../utils/offset-style";

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
	const hostName = createPortalBoundaryHostName(host.hostKey, host.boundaryId);
	const hostClosing = AnimationStore.getValue(host.screenKey, "closing");
	const hostProgress = AnimationStore.getValue(
		host.screenKey,
		"transitionProgress",
	);
	const hostGestureDismissing = GestureStore.getValue(
		host.screenKey,
		"dismissing",
	);
	const hostScrollMetadata = ScrollStore.getValue(host.screenKey, "metadata");
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

		// Make the coordinate case explicit before resolving the host offset.
		// The resolver owns the math; this component decides which screen/scroll
		// relationship the active portal is in.
		const isCrossScreenPortal = link.source.screenKey !== host.screenKey;
		const isHostClosing =
			hostClosing.get() === 1 || hostGestureDismissing.get() === 1;
		const placement: PortalOffsetPlacement = !isCrossScreenPortal
			? "same-screen"
			: isHostClosing
				? "cross-screen-close"
				: "cross-screen-open";

		// A source that originated inside its own scroll host moves with that
		// ScrollView while this portal stays attached over here. Shifting the
		// source rect by the clamped source scroll travel keeps the return
		// landing point on the live placeholder, so the close detach is seamless.
		const trackSourceScroll =
			isCrossScreenPortal && link.source.sourceHost?.capturesScroll === true;

		return resolvePortalOffsetStyle({
			bounds: link.source.bounds,
			hostCurrentScroll:
				placement === "cross-screen-close" ? hostScrollMetadata.get() : null,
			hostKey: host.hostKey,
			placement,
			sourceCurrentScroll: trackSourceScroll
				? sourceScrollMetadata.get()
				: null,
			hostProgress: hostProgress.get(),
			trackSourceScroll,
		});
	});
	const contentFrameStyle = useAnimatedStyle(() => {
		"worklet";
		const link = getLink(host.pairKey, host.boundaryId);
		if (!link?.source) {
			return NO_STYLES;
		}

		return {
			height: link.source.bounds.height,
			width: link.source.bounds.width,
		};
	});
	const slotStyle = useAnimatedStyle(() => {
		"worklet";
		const link = getLink(host.pairKey, host.boundaryId);
		const isMatchedScreenPortal =
			link?.source?.portalAttachTarget === "matched-screen";

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
			pointerEvents="box-none"
			style={[style, hostStyle]}
			collapsable={false}
		>
			<AnimatedPortalBoundaryHost
				name={hostName}
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
