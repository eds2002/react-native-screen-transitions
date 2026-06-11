import { memo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { PortalHost as NativePortalHost } from "react-native-teleport";
import { NO_STYLES } from "../../../../constants";
import { getResolvedLink } from "../../../../stores/bounds/internals/links";
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
	const hostScrollMetadata = ScrollStore.getValue(host.screenKey, "metadata");
	const hostStyle = useAnimatedStyle(() => {
		"worklet";
		const link = getResolvedLink(host.pairKey, host.boundaryId).link;
		if (!link?.source || !link.destination) {
			return NO_STYLES;
		}

		// Cross-screen teleported content is placed at the source rect, which is
		// fixed in screen space while this host may scroll away with its
		// ScrollView. Compensating with the clamped scroll travel since the host
		// measurement keeps the source rect expressed in the host's current
		// frame. Hosts that do not capture scroll store no scroll snapshot, so
		// the delta resolves to 0 and they stay untouched.
		const shouldCompensateHostScroll = link.source.screenKey !== host.screenKey;

		return resolvePortalOffsetStyle({
			bounds: link.source.bounds,
			hostCurrentScroll: shouldCompensateHostScroll
				? hostScrollMetadata.get()
				: null,
			hostKey: host.hostKey,
			includeScrollOffsets: shouldCompensateHostScroll,
		});
	});

	return (
		<AnimatedPortalBoundaryHost name={hostName} style={[style, hostStyle]} />
	);
});
