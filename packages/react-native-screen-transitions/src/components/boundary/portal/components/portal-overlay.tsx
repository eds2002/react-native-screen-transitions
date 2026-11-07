import { memo } from "react";
import {
	I18nManager,
	StyleSheet,
	useWindowDimensions,
	View,
} from "react-native";
import Animated, {
	type SharedValue,
	useAnimatedReaction,
	useAnimatedStyle,
} from "react-native-reanimated";
import { NO_STYLES } from "../../../../constants";
import { useBuilderStore } from "../../../../providers/builder";
import {
	getScrollChainAxisDelta,
	ScrollStore,
} from "../../../../stores/scroll.store";
import type { ScrollMetadataState } from "../../../../types/gesture.types";
import { readLocalMeasurement } from "../../utils/local-measurements";
import { resolvePortalOffsetStyle } from "../helpers/offset-style";
import {
	type HostBounds,
	useHostMeasurement,
} from "../hooks/use-host-measurement";
import {
	type ActivePortalBoundaryHost,
	useActivePortalBoundaryHosts,
} from "../stores/portal-boundary-host.store";
import { PORTAL_POINTER_EVENTS } from "../teleport";
import { PortalHost } from "./portal-host";

/**
 * A screen-sized overlay at the screen's content origin, containing the receivers for its escaped
 * boundary frames: one positioned PortalHost per boundary measured for a transition, each receiving
 * one named portal. Handoff between screens uses receivers inside boundaries instead.
 */
export const PortalOverlay = memo(function PortalOverlay() {
	const screenKey = useBuilderStore((s) => s.derivations.currentScreenKey);
	const activeBoundaryHosts = useActivePortalBoundaryHosts(screenKey);

	const { height: viewportHeight, width: viewportWidth } =
		useWindowDimensions();

	const scrollMetadata = ScrollStore.getValue(screenKey, "metadata");
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
				scrollMetadata={scrollMetadata}
			/>
		</View>
	));

	return (
		<Animated.View
			ref={measurement.hostRef}
			pointerEvents={PORTAL_POINTER_EVENTS}
			style={[styles.host, { width: viewportWidth, height: viewportHeight }]}
			collapsable={false}
		>
			{boundaryHosts}
		</Animated.View>
	);
});

const getCurrentBoundaryBounds = (host: ActivePortalBoundaryHost) => {
	"worklet";
	return readLocalMeasurement(host.localMeasurement)?.bounds ?? null;
};

type BoundaryPortalPlacementProps = {
	host: ActivePortalBoundaryHost;
	hostBounds: SharedValue<HostBounds | null>;
	scrollMetadata: SharedValue<ScrollMetadataState | null>;
};

/** Positions one receiver using captured boundary and overlay measurements. */
const BoundaryPortalPlacement = memo(function BoundaryPortalPlacement({
	host,
	hostBounds,
	scrollMetadata,
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

		// The overlay sits at the screen's content origin: a boundary measured with its place in that
		// content goes there, however the screen was drawn when either was measured. The escaped
		// frame left its scroll views: follow them by how far they moved since it was measured, read
		// from the scroll event's own write.
		const live = scrollMetadata.get();
		const chain = boundaryBounds.scrollChain ?? [];
		const inContent = boundaryBounds.contentOffset;
		return resolvePortalOffsetStyle({
			bounds: inContent
				? { ...boundaryBounds, pageX: inContent.x, pageY: inContent.y }
				: boundaryBounds,
			hostBounds: inContent ? null : hostBounds.get(),
			scrollDeltaX: getScrollChainAxisDelta(live, chain, "horizontal"),
			scrollDeltaY: getScrollChainAxisDelta(live, chain, "vertical"),
		});
	});

	const contentFrameStyle = useAnimatedStyle(() => {
		"worklet";
		const boundaryBounds = getCurrentBoundaryBounds(host);
		if (!boundaryBounds) {
			return NO_STYLES;
		}

		// The frame is laid out as in the screen (unscaled: the screen's transform scales the overlay
		// with it); measured bounds include the transform it was measured with.
		const inContent = boundaryBounds.contentOffset;
		return {
			height: inContent?.height ?? boundaryBounds.height,
			width: inContent?.width ?? boundaryBounds.width,
		};
	});

	const slotStyle = useAnimatedStyle(() => {
		"worklet";
		return host.slotsMap.get()[host.boundaryId]?.style ?? NO_STYLES;
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
