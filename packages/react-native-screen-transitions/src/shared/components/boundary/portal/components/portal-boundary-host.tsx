import { memo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { PortalHost as NativePortalHost } from "react-native-teleport";
import { NO_STYLES } from "../../../../constants";
import { AnimationStore } from "../../../../stores/animation.store";
import { getSourceScreenKeyFromPairKey } from "../../../../stores/bounds/helpers/link-pairs.helpers";
import { getLink } from "../../../../stores/bounds/internals/links";
import { GestureStore } from "../../../../stores/gesture.store";
import { ScrollStore } from "../../../../stores/scroll.store";
import type { ActivePortalBoundaryHost } from "../stores/portal-boundary-host.store";
import { createPortalBoundaryHostName } from "../utils/naming";
import { resolvePortalOffsetStyle } from "../utils/offset-style";

const AnimatedPortalBoundaryHost =
	Animated.createAnimatedComponent(NativePortalHost);

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
	const hostProgress = AnimationStore.getValue(host.screenKey, "progress");
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

		// Opening/idle placement is resolved once from the host measurement so a
		// nested host moves with its container instead of behaving like a sticky
		// overlay. Closing is the opposite: the return path needs the host's live
		// scroll frame for the whole dismissal.
		const isCrossScreenPortal = link.source.screenKey !== host.screenKey;
		const isHostClosing =
			hostClosing.get() === 1 || hostGestureDismissing.get() === 1;
		const shouldCompensateHostScroll = isCrossScreenPortal && isHostClosing;

		// A source that originated inside its own scroll host moves with that
		// ScrollView while this portal stays attached over here. Shifting the
		// source rect by the clamped source scroll travel keeps the return
		// landing point on the live placeholder, so the close detach is seamless.
		const compensateSourceScroll =
			isCrossScreenPortal && link.source.sourceHost?.capturesScroll === true;

		return resolvePortalOffsetStyle({
			bounds: link.source.bounds,
			compensateSourceScroll,
			hostCurrentScroll: shouldCompensateHostScroll
				? hostScrollMetadata.get()
				: null,
			hostKey: host.hostKey,
			includeScrollOffsets: shouldCompensateHostScroll,
			sourceCurrentScroll: compensateSourceScroll
				? sourceScrollMetadata.get()
				: null,
			hostProgress: hostProgress.get(),
		});
	});

	return (
		<AnimatedPortalBoundaryHost name={hostName} style={[style, hostStyle]} />
	);
});
