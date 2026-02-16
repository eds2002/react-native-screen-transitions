import {
	NavigationContext,
	NavigationRouteContext,
} from "@react-navigation/native";
import { memo, useMemo } from "react";
import { Animated, StyleSheet, useWindowDimensions, View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScreenAnimation } from "../../../hooks/animation/use-screen-animation";
import type { StackScene } from "../../../hooks/navigation/use-stack";
import type { BaseDescriptor } from "../../../providers/screen/keys.provider";
import type { OverlayInterpolationProps } from "../../../types/animation.types";
import type {
	OverlayProps,
	OverlayScreenState,
} from "../../../types/overlay.types";

type OverlayHostProps = {
	scene: StackScene;
	overlayScreenState: OverlayScreenState<BaseDescriptor["navigation"]>;
};

export const OverlayHost = memo(function OverlayHost({
	scene,
	overlayScreenState,
}: OverlayHostProps) {
	const OverlayComponent = scene.descriptor.options.overlay;
	const screen = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const screenAnimation = useScreenAnimation();
	const relativeProgress = useDerivedValue(() => {
		"worklet";
		return screenAnimation.value.stackProgress;
	});

	const overlayAnimation = useDerivedValue<OverlayInterpolationProps>(() => ({
		progress: relativeProgress.value,
		layouts: { screen },
		insets,
	}));

	const overlayProps: OverlayProps<BaseDescriptor["navigation"]> = useMemo(
		() => ({
			...overlayScreenState,
			progress: relativeProgress,
			/**@deprecated */
			overlayAnimation,
			/**@deprecated */
			screenAnimation,
		}),
		[relativeProgress, overlayAnimation, screenAnimation, overlayScreenState],
	);

	if (!OverlayComponent) {
		return null;
	}

	return (
		<Animated.View
			pointerEvents="box-none"
			style={[styles.container, styles.floating, styles.absolute]}
		>
			<NavigationContext.Provider value={scene.descriptor.navigation as any}>
				<NavigationRouteContext.Provider value={scene.route}>
					<View pointerEvents="box-none" style={styles.overlay}>
						<OverlayComponent {...overlayProps} />
					</View>
				</NavigationRouteContext.Provider>
			</NavigationContext.Provider>
		</Animated.View>
	);
});

const styles = StyleSheet.create({
	overlay: {
		...StyleSheet.absoluteFillObject,
		zIndex: 1,
	},
	container: {
		flex: 1,
	},
	absolute: StyleSheet.absoluteFillObject,
	floating: {
		zIndex: 1000,
	},
});
