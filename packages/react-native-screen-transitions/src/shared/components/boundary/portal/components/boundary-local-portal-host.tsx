import { memo, useCallback, useLayoutEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { SystemStore } from "../../../../stores/system.store";
import { NativePortalHost } from "../teleport";
import { createBoundaryLocalPortalHostName } from "../utils/naming";

const AnimatedPortalHost = NativePortalHost
	? Animated.createAnimatedComponent(NativePortalHost)
	: null;

type BoundaryLocalPortalHostProps = {
	boundaryId: string;
	enabled: boolean;
	screenKey: string;
};

export const BoundaryLocalPortalHost = memo(function BoundaryLocalPortalHost({
	boundaryId,
	enabled,
	screenKey,
}: BoundaryLocalPortalHostProps) {
	const { pendingLifecycleStartBlockCount } = SystemStore.getBag(screenKey);
	const handleLayout = useCallback(() => {
		pendingLifecycleStartBlockCount.set(0);
	}, [pendingLifecycleStartBlockCount]);

	useLayoutEffect(() => {
		if (!enabled || !AnimatedPortalHost) {
			return;
		}

		pendingLifecycleStartBlockCount.set(0);
	}, [enabled, pendingLifecycleStartBlockCount]);

	if (!enabled || !AnimatedPortalHost) {
		return null;
	}

	const portalHostName = createBoundaryLocalPortalHostName(
		screenKey,
		boundaryId,
	);

	return (
		<View
			pointerEvents="none"
			style={styles.hostWrapper}
			onLayout={handleLayout}
			collapsable={false}
		>
			<AnimatedPortalHost name={portalHostName} style={styles.host} />
		</View>
	);
});

const styles = StyleSheet.create({
	host: {
		...StyleSheet.absoluteFillObject,
		overflow: "visible",
	},
	hostWrapper: {
		...StyleSheet.absoluteFillObject,
		overflow: "visible",
	},
});
