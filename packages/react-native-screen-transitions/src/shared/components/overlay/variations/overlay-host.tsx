import {
	NavigationContext,
	NavigationRouteContext,
} from "@react-navigation/native";
import { memo, useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import type { StackScene } from "../../../hooks/navigation/use-stack";
import { useScreenAnimation } from "../../../providers/screen/animation";
import type { BaseDescriptor } from "../../../providers/screen/descriptors";
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

	const screenAnimation = useScreenAnimation();
	const relativeProgress = useDerivedValue(() => {
		"worklet";
		return screenAnimation.get().stackProgress;
	});

	const overlayProps: OverlayProps<BaseDescriptor["navigation"]> = useMemo(
		() => ({
			...overlayScreenState,
			progress: relativeProgress,
		}),
		[relativeProgress, overlayScreenState],
	);

	if (!OverlayComponent) {
		return null;
	}

	return (
		<Animated.View
			pointerEvents="box-none"
			style={[styles.container, styles.floating, StyleSheet.absoluteFill]}
		>
			<NavigationContext.Provider value={scene.descriptor.navigation as any}>
				<NavigationRouteContext.Provider value={scene.route}>
					<View
						pointerEvents="box-none"
						style={[StyleSheet.absoluteFill, styles.overlay]}
					>
						<OverlayComponent {...overlayProps} />
					</View>
				</NavigationRouteContext.Provider>
			</NavigationContext.Provider>
		</Animated.View>
	);
});

const styles = StyleSheet.create({
	overlay: {
		zIndex: 1,
	},
	container: {
		flex: 1,
	},
	floating: {
		zIndex: 1000,
	},
});
