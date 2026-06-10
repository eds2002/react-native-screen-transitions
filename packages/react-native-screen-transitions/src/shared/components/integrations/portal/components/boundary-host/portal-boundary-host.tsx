import { memo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { PortalHost as NativePortalHost } from "react-native-teleport";
import { NO_STYLES } from "../../../../../constants";
import { getResolvedLink } from "../../../../../stores/bounds/internals/links";
import { ScrollStore } from "../../../../../stores/scroll.store";
import type { ActivePortalBoundaryHost } from "../../stores/portal-boundary-host.store";
import {
	createPortalBoundaryHostName,
	resolvePortalOffsetStyle,
} from "../../utils";

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

		const shouldCompensateHostScroll =
			!host.capturesScroll && link.source.screenKey !== host.screenKey;

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
