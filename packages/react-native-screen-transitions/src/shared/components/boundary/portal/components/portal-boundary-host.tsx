import { memo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import { AnimationStore } from "../../../../stores/animation.store";
import { getSourceScreenKeyFromPairKey } from "../../../../stores/bounds/helpers/link-pairs.helpers";
import { getLink } from "../../../../stores/bounds/internals/links";
import { GestureStore } from "../../../../stores/gesture.store";
import { ScrollStore } from "../../../../stores/scroll.store";
import type { ActivePortalBoundaryHost } from "../stores/portal-boundary-host.store";
import { NativePortalHost } from "../teleport";
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

	// Without `react-native-teleport` no portal ever mounts a boundary host, so
	// this never renders — the guard just narrows the nullable animated host.
	if (!AnimatedPortalBoundaryHost) {
		return null;
	}

	return (
		<AnimatedPortalBoundaryHost name={hostName} style={[style, hostStyle]} />
	);
});
