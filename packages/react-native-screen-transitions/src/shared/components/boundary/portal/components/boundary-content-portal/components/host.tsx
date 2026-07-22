import { memo, type ReactNode } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedProps } from "react-native-reanimated";
import { isTransitionVisuallyClosed } from "../../../../../../providers/screen/styles/helpers/transition-visual-state";
import { AnimationStore } from "../../../../../../stores/animation.store";
import { SystemStore } from "../../../../../../stores/system.store";
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
		const closing = AnimationStore.getValue(screenKey, "closing");
		const animationProgress = SystemStore.getValue(
			screenKey,
			"animationProgress",
		);
		const targetProgress = SystemStore.getValue(screenKey, "targetProgress");
		const portalHostName = createBoundaryContentPortalHostName(
			screenKey,
			boundaryId,
		);
		const animatedHostProps = useAnimatedProps(() => {
			"worklet";
			return {
				name: isTransitionVisuallyClosed({
					closing: closing.get(),
					animationProgress: animationProgress.get(),
					targetProgress: targetProgress.get(),
				})
					? null
					: portalHostName,
			};
		});

		if (!enabled || !AnimatedPortalHost) {
			return <>{children}</>;
		}

		return (
			<>
				{children}
				<AnimatedPortalHost
					animatedProps={animatedHostProps}
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
