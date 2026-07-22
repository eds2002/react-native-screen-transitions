import { memo, type ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { NativePortalHost, PORTAL_POINTER_EVENTS } from "../../../teleport";
import { createBoundaryContentPortalHostName } from "../helpers/host-name";

const AnimatedPortalHost = NativePortalHost
	? Animated.createAnimatedComponent(NativePortalHost)
	: null;

type BoundaryContentPortalHostProps = {
	boundaryId: string;
	children: ReactNode;
	enabled: boolean;
	screenKey: string;
};

export const BoundaryContentPortalHost = memo(
	function BoundaryContentPortalHost({
		boundaryId,
		children,
		enabled,
		screenKey,
	}: BoundaryContentPortalHostProps) {
		const portalHostName = createBoundaryContentPortalHostName(
			screenKey,
			boundaryId,
		);
		if (!enabled || !AnimatedPortalHost) {
			return <>{children}</>;
		}

		return (
			<>
				{children}
				<AnimatedPortalHost
					name={portalHostName}
					pointerEvents={PORTAL_POINTER_EVENTS}
					style={styles.host}
				/>
			</>
		);
	},
);

const styles = StyleSheet.create({
	host: {
		...StyleSheet.absoluteFillObject,
		overflow: "visible",
	},
});
