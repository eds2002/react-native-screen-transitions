import { memo, useCallback } from "react";
import {
	I18nManager,
	type StyleProp,
	StyleSheet,
	type ViewStyle,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useFrameCallback,
	useSharedValue,
} from "react-native-reanimated";
import { NO_STYLES } from "../../../../../../constants";
import { composeSlotStyleWithLocalTransform } from "../../../../../../providers/screen/styles/helpers/compose-slot-style";
import { getLink } from "../../../../../../stores/bounds/internals/links";
import { SystemStore } from "../../../../../../stores/system.store";
import type { ScrollMeasuredDimensions } from "../../../../utils/measured-bounds";
import { NativePortalHost, PORTAL_POINTER_EVENTS } from "../../../teleport";
import { resolvePortalOffsetStyle } from "../helpers/offset-style";
import { getPortalHostBounds } from "../stores/host-bounds.store";
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
	const geometryReadyFrames = useSharedValue(0);
	const { unblockLifecycleStart } = SystemStore.getBag(host.screenKey).actions;

	const handleFrame = useCallback(() => {
		"worklet";
		if (host.portalHostReady.get()) {
			return;
		}

		const link = getLink(host.pairKey, host.boundaryId);
		const hasSource = !!link?.source;
		const hasHostBounds = getPortalHostBounds(host.hostKey) !== null;
		const hasSlot = host.slotsMap.get()[host.boundaryId] !== undefined;
		const hasGeometry = hasSource && hasHostBounds && hasSlot;

		if (!hasGeometry) {
			geometryReadyFrames.set(0);
			return;
		}

		if (geometryReadyFrames.get() === 0) {
			// Give the source frame, host offset, and slot style one UI frame to
			// reach native before Teleport targets this receiver.
			geometryReadyFrames.set(1);
			return;
		}

		host.portalHostReady.set(true);
		unblockLifecycleStart();
	}, [geometryReadyFrames, host, unblockLifecycleStart]);

	useFrameCallback(handleFrame, true);

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

		return resolvePortalOffsetStyle({
			bounds: sourceBounds,
			hostKey: host.hostKey,
			placement: isCrossScreenPortal ? "cross-screen" : "same-screen",
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

// The teleport offset is a physical page delta measured from the screen's
// left edge, so the content box must anchor there too. Under native RTL,
// `left: 0` swaps to a right-edge anchor; `end: 0` is the physical left edge
// in RTL regardless of the swap setting.
const styles = StyleSheet.create({
	content: I18nManager.isRTL
		? {
				end: 0,
				position: "absolute",
				top: 0,
			}
		: {
				left: 0,
				position: "absolute",
				top: 0,
			},
});
