import { memo } from "react";
import {
	I18nManager,
	type StyleProp,
	StyleSheet,
	type ViewStyle,
} from "react-native";
import Animated, {
	type MeasuredDimensions,
	type SharedValue,
	useAnimatedReaction,
	useAnimatedStyle,
} from "react-native-reanimated";
import { NO_STYLES } from "../../../../../../constants";
import { composeSlotStyleWithLocalTransform } from "../../../../../../providers/screen/styles/helpers/compose-slot-style";
import { NativePortalHost, PORTAL_POINTER_EVENTS } from "../../../teleport";
import { resolveBoundaryLocalMeasurement } from "../helpers/local-measurement";
import { resolvePortalOffsetStyle } from "../helpers/offset-style";
import type { ActivePortalBoundaryHost } from "../stores/portal-boundary-host.store";

const AnimatedPortalBoundaryHost = NativePortalHost
	? Animated.createAnimatedComponent(NativePortalHost)
	: null;

const getCurrentBoundaryBounds = (host: ActivePortalBoundaryHost) => {
	"worklet";
	return resolveBoundaryLocalMeasurement(
		host.localMeasurement.get(),
		host.pairKey,
	);
};

type PortalBoundaryHostProps = {
	host: ActivePortalBoundaryHost;
	hostBounds: SharedValue<MeasuredDimensions | null>;
	hostMeasurementKey: string | null;
	measuredHostKey: SharedValue<string | null>;
	style?: StyleProp<ViewStyle>;
};

export const PortalBoundaryHost = memo(function PortalBoundaryHost({
	host,
	hostBounds,
	hostMeasurementKey,
	measuredHostKey,
	style,
}: PortalBoundaryHostProps) {
	useAnimatedReaction(
		() => {
			"worklet";
			return (
				getCurrentBoundaryBounds(host) !== null &&
				hostBounds.get() !== null &&
				!!hostMeasurementKey &&
				measuredHostKey.get() === hostMeasurementKey
			);
		},
		(ready) => {
			"worklet";
			if (ready) {
				host.portalHostReady.set(true);
			}
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
