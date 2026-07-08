import { memo } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { NativePortalHost } from "../teleport";
import { createBoundaryHandoffPortalHostName } from "../utils/naming";

const AnimatedPortalHost = NativePortalHost
	? Animated.createAnimatedComponent(NativePortalHost)
	: null;

type BoundaryHandoffPortalHostProps = {
	boundaryId: string;
	enabled: boolean;
	screenKey: string;
};

export const BoundaryHandoffPortalHost = memo(
	function BoundaryHandoffPortalHost({
		boundaryId,
		enabled,
		screenKey,
	}: BoundaryHandoffPortalHostProps) {
		if (!enabled || !AnimatedPortalHost) {
			return null;
		}

		const portalHostName = createBoundaryHandoffPortalHostName(
			screenKey,
			boundaryId,
		);

		return <AnimatedPortalHost name={portalHostName} style={styles.host} />;
	},
);

const styles = StyleSheet.create({
	host: {
		...StyleSheet.absoluteFillObject,
		overflow: "visible",
	},
});
