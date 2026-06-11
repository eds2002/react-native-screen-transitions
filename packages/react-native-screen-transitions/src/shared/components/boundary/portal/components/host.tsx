import { memo, useLayoutEffect, useRef } from "react";
import {
	type StyleProp,
	StyleSheet,
	useWindowDimensions,
	View,
	type ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";
import { useDescriptorsStore } from "../../../../providers/screen/descriptors";
import { useHostMeasurement } from "../hooks/use-host-measurement";
import { registerHost, unregisterHost } from "../stores/host-registry.store";
import { useActivePortalBoundaryHosts } from "../stores/portal-boundary-host.store";
import { PortalBoundaryHost } from "./portal-boundary-host";

let nextHostId = 0;

type HostProps = {
	style?: StyleProp<ViewStyle>;
	/** Internal fallback planted by the screen container. */
	fallback?: boolean;
};

export const Host = memo(function Host({ fallback = false, style }: HostProps) {
	const screenKey = useDescriptorsStore((s) => s.derivations.currentScreenKey);
	const generatedHostKeyRef = useRef<string | null>(null);

	if (generatedHostKeyRef.current === null) {
		generatedHostKeyRef.current = `${screenKey}-host-${nextHostId++}`;
	}

	const hostKey = fallback ? screenKey : generatedHostKeyRef.current;
	const capturesScroll = !fallback;
	const activeBoundaryHosts = useActivePortalBoundaryHosts(hostKey);
	const { height: viewportHeight, width: viewportWidth } =
		useWindowDimensions();

	const measurement = useHostMeasurement({
		capturesScroll,
		hasBoundaryHosts: activeBoundaryHosts.length > 0,
		hostKey,
		screenKey,
		viewportHeight,
	});

	useLayoutEffect(() => {
		registerHost({
			capturesScroll,
			fallback,
			hostKey,
			screenKey,
		});

		return () => {
			unregisterHost(screenKey, hostKey);
		};
	}, [capturesScroll, fallback, hostKey, screenKey]);

	const boundaryHosts = measurement.canRenderHosts
		? activeBoundaryHosts.map((host) => (
				<View
					key={host.boundaryId}
					pointerEvents="box-none"
					style={[
						styles.boundaryHostViewport,
						{ width: viewportWidth, height: viewportHeight },
					]}
				>
					<PortalBoundaryHost host={host} style={StyleSheet.absoluteFill} />
				</View>
			))
		: null;

	return (
		<Animated.View
			ref={measurement.hostRef}
			pointerEvents="box-none"
			style={[
				styles.host,
				{ width: viewportWidth, height: viewportHeight },
				style,
			]}
			collapsable={false}
			onLayout={measurement.onHostLayout}
		>
			{boundaryHosts}
		</Animated.View>
	);
});

const styles = StyleSheet.create({
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
