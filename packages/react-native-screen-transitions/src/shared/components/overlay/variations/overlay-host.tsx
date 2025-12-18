import {
	NavigationContext,
	NavigationRouteContext,
	type Route,
} from "@react-navigation/native";
import { memo, useMemo } from "react";
import { Animated, StyleSheet, useWindowDimensions, View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScreenAnimation } from "../../../hooks/animation/use-screen-animation";
import { type StackScene, useStack } from "../../../hooks/navigation/use-stack";
import { useSharedValueState } from "../../../hooks/reanimated/use-shared-value-state";
import type { OverlayInterpolationProps } from "../../../types/animation.types";
import type { OverlayProps } from "../../../types/core.types";

type OverlayHostProps = {
	scene: StackScene;
	scenes: StackScene[];
	routes: Route<string>[];
	overlayIndex: number;
	isFloating?: boolean;
};

export const OverlayHost = memo(function OverlayHost({
	scene,
	scenes,
	routes,
	overlayIndex,
	isFloating,
}: OverlayHostProps) {
	const OverlayComponent = scene.descriptor.options.overlay;
	const screen = useWindowDimensions();

	const { stackProgress, optimisticFocusedIndex, routeKeys } = useStack();
	const insets = useSafeAreaInsets();

	const relativeProgress = useDerivedValue(() => {
		"worklet";
		return stackProgress.value - overlayIndex;
	});

	// For float overlays: global focused index (can be any screen in the stack)
	// For screen overlays: relative to overlay position (only screens at or after)
	const optimisticActiveIndex = useSharedValueState(
		useDerivedValue(() => {
			"worklet";
			if (isFloating) {
				// For float overlays, use global optimistic focused index directly
				const globalIndex = optimisticFocusedIndex.get();
				const clampedIndex = Math.max(
					0,
					Math.min(globalIndex, routeKeys.length - 1),
				);
				return clampedIndex;
			}

			// For screen overlays, compute relative to overlay position
			const screensAbove = routeKeys.length - 1 - overlayIndex;
			const relativeOptimistic = optimisticFocusedIndex.value - overlayIndex;
			const result = Math.max(0, Math.min(relativeOptimistic, screensAbove));

			return result;
		}),
	);

	const overlayAnimation = useDerivedValue<OverlayInterpolationProps>(() => ({
		progress: relativeProgress.value,
		layouts: { screen },
		insets,
	}));

	const focusedScene = useMemo(() => {
		if (overlayIndex === -1) {
			return scene;
		}

		if (isFloating) {
			// For float overlays, optimisticActiveIndex is the global focused index
			return scenes[optimisticActiveIndex] ?? scene;
		}

		// For screen overlays, optimisticActiveIndex is relative to overlayIndex
		const maxOffset = Math.max(scenes.length - overlayIndex - 1, 0);
		const normalizedIndex = Math.min(
			Math.max(optimisticActiveIndex, 0),
			maxOffset,
		);

		return scenes[overlayIndex + normalizedIndex] ?? scene;
	}, [overlayIndex, optimisticActiveIndex, scenes, scene, isFloating]);

	const screenAnimation = useScreenAnimation();

	if (!OverlayComponent) {
		return null;
	}

	const overlayProps: OverlayProps<typeof scene.descriptor.navigation> = {
		routes,
		overlayAnimation,
		screenAnimation,
		focusedRoute: focusedScene.route,
		focusedIndex: optimisticActiveIndex,
		meta: focusedScene.descriptor.options.meta,
		navigation: scene.descriptor.navigation,
	};

	// Cast to OverlayProps function - container overlays are handled by ContainerOverlay component
	const renderOverlay = OverlayComponent as (
		props: OverlayProps,
	) => React.ReactNode;

	return (
		<Animated.View
			pointerEvents="box-none"
			style={[
				styles.container,
				isFloating ? styles.floating : { zIndex: 1 },
				styles.absolute,
			]}
		>
			<NavigationContext.Provider
				// biome-ignore lint/suspicious/noExplicitAny: navigation type varies by stack
				value={scene.descriptor.navigation as any}
			>
				<NavigationRouteContext.Provider value={scene.route}>
					<View pointerEvents="box-none" style={styles.overlay}>
						{renderOverlay(overlayProps)}
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
