import { memo, useId, useLayoutEffect } from "react";
import {
	I18nManager,
	type StyleProp,
	StyleSheet,
	useWindowDimensions,
	View,
	type ViewStyle,
} from "react-native";
import Animated, {
	type MeasuredDimensions,
	type SharedValue,
	useAnimatedReaction,
	useAnimatedStyle,
} from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import { useBuilderStore } from "../../../../providers/builder";
import { composeSlotStyleWithLocalTransform } from "../../../../providers/orchestrator/styles/helpers/compose-slot-style";
import { resolvePortalOffsetStyle } from "../helpers/offset-style";
import { useHostMeasurement } from "../hooks/use-host-measurement";
import { registerHost, unregisterHost } from "../stores/host-registry.store";
import {
	type ActivePortalBoundaryHost,
	useActivePortalBoundaryHosts,
} from "../stores/portal-boundary-host.store";
import { PORTAL_POINTER_EVENTS } from "../teleport";
import { PortalHost } from "./portal-host";

type PortalOverlayProps = {
	style?: StyleProp<ViewStyle>;
	fallback?: boolean;
};

/**
 * A screen-sized overlay containing the receivers for escaped boundary frames.
 *
 * Registers this overlay as an available placement, measures its origin, and
 * renders one positioned PortalHost per boundary assigned to it. An overlay can
 * contain many hosts; each host receives one named portal.
 *
 * Boundary.Host uses this directly; screens render it with `fallback` for
 * their automatic overlay. Explicit overlays take priority over the fallback.
 * Handoff between screens uses receivers inside boundaries, so it does not
 * need this overlay unless escapeClipping is also enabled.
 */
export const PortalOverlay = memo(function PortalOverlay({
	fallback = false,
	style,
}: PortalOverlayProps) {
	const screenKey = useBuilderStore((s) => s.derivations.currentScreenKey);
	const id = useId();
	const hostKey = fallback ? screenKey : `${screenKey}-host-${id}`;
	const activeBoundaryHosts = useActivePortalBoundaryHosts(hostKey);

	const { height: viewportHeight, width: viewportWidth } =
		useWindowDimensions();

	const measurement = useHostMeasurement({
		enabled: activeBoundaryHosts.length > 0,
		boundaryMeasurements: activeBoundaryHosts.map(
			(host) => host.localMeasurement,
		),
	});

	const boundaryHosts = activeBoundaryHosts.map((host) => (
		<View
			key={host.portalHostName}
			pointerEvents={PORTAL_POINTER_EVENTS}
			style={[
				styles.boundaryHostViewport,
				{ width: viewportWidth, height: viewportHeight },
			]}
		>
			<BoundaryPortalPlacement
				host={host}
				hostBounds={measurement.hostBounds}
			/>
		</View>
	));

	useLayoutEffect(() => {
		registerHost({
			fallback,
			hostKey,
			screenKey,
		});

		return () => {
			unregisterHost(screenKey, hostKey);
		};
	}, [fallback, hostKey, screenKey]);

	return (
		<Animated.View
			ref={measurement.hostRef}
			pointerEvents={PORTAL_POINTER_EVENTS}
			style={[
				styles.host,
				{ width: viewportWidth, height: viewportHeight },
				style,
			]}
			collapsable={false}
		>
			{boundaryHosts}
		</Animated.View>
	);
});

const getCurrentBoundaryBounds = (host: ActivePortalBoundaryHost) => {
	"worklet";
	return host.localMeasurement.get()?.bounds ?? null;
};

type BoundaryPortalPlacementProps = {
	host: ActivePortalBoundaryHost;
	hostBounds: SharedValue<MeasuredDimensions | null>;
};

/** Positions one receiver using captured boundary and overlay measurements. */
const BoundaryPortalPlacement = memo(function BoundaryPortalPlacement({
	host,
	hostBounds,
}: BoundaryPortalPlacementProps) {
	useAnimatedReaction(
		() => {
			"worklet";
			return (
				getCurrentBoundaryBounds(host) !== null && hostBounds.get() !== null
			);
		},
		(ready) => {
			"worklet";
			host.portalHostReady.set(ready);
		},
	);

	const hostStyle = useAnimatedStyle(() => {
		"worklet";
		const boundaryBounds = getCurrentBoundaryBounds(host);
		if (!boundaryBounds) {
			return NO_STYLES;
		}

		return resolvePortalOffsetStyle({
			bounds: boundaryBounds,
			hostBounds: hostBounds.get(),
		});
	});

	const contentFrameStyle = useAnimatedStyle(() => {
		"worklet";
		const boundaryBounds = getCurrentBoundaryBounds(host);
		if (!boundaryBounds) {
			return NO_STYLES;
		}

		return {
			height: boundaryBounds.height,
			width: boundaryBounds.width,
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

	return (
		<Animated.View
			pointerEvents={PORTAL_POINTER_EVENTS}
			style={[StyleSheet.absoluteFill, hostStyle]}
			collapsable={false}
		>
			<PortalHost
				name={host.portalHostName}
				style={[styles.content, contentFrameStyle, slotStyle]}
			/>
		</Animated.View>
	);
});

const styles = StyleSheet.create({
	// The teleport offset is a physical page delta measured from the screen's
	// left edge, so the content box must anchor there too. Under native RTL,
	// `left: 0` swaps to a right-edge anchor; `end: 0` is the physical left edge
	// in RTL regardless of the swap setting.
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

	host: {
		elevation: 999999,
		left: 0,
		overflow: "visible",
		position: "absolute",
		top: 0,
		zIndex: 999999,
	},
	boundaryHostViewport: {
		left: 0,
		overflow: "visible",
		position: "absolute",
		top: 0,
	},
});
