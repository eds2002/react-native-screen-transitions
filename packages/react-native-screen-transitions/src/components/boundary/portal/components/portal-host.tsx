import { type ComponentProps, memo } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { NativePortalHost, PORTAL_POINTER_EVENTS } from "../teleport";

const AnimatedHost = NativePortalHost
	? Animated.createAnimatedComponent(NativePortalHost)
	: null;

/**
 * The native receiving point for a Portal whose destination matches `name`.
 *
 * Handoff places this inside a boundary, filling its local frame. Escape-clipping
 * places it inside a PortalOverlay, which supplies
 * the boundary's size, offset, and animated styles. This component only renders
 * the receiver; destination selection and measurement belong to its callers.
 */
export const PortalHost = memo(function PortalHost({
	name,
	style = styles.inline,
}: {
	name: string;
	style?: ComponentProps<typeof Animated.View>["style"];
}) {
	return AnimatedHost ? (
		<AnimatedHost
			name={name}
			pointerEvents={PORTAL_POINTER_EVENTS}
			style={style}
		/>
	) : null;
});

const styles = StyleSheet.create({
	inline: { ...StyleSheet.absoluteFill, overflow: "visible" },
});
