import { memo, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { useScreenAnimation } from "../../../hooks/animation/use-screen-animation";
import { type StackScene, useStack } from "../../../hooks/navigation/use-stack";
import type { OverlayInterpolationProps } from "../../../types/animation.types";
import type { ContainerOverlayProps } from "../../../types/core.types";
import { getActiveContainerOverlay } from "../helpers/get-active-overlay";

/**
 * Inner component that renders when container overlay is active.
 * Separated to ensure hooks are called unconditionally.
 */
const ContainerOverlayHost = memo(function ContainerOverlayHost({
	children,
	scene,
	scenes,
	overlayIndex,
}: {
	children: React.ReactNode;
	scene: StackScene;
	scenes: StackScene[];
	overlayIndex: number;
}) {
	const { routes, focusedIndex, stackProgress } = useStack();
	const screen = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const OverlayComponent = scene.descriptor.options.overlay;

	// Compute relative progress from overlay position
	const relativeProgress = useDerivedValue(() => {
		"worklet";
		return stackProgress.value - overlayIndex;
	});

	const overlayAnimation = useDerivedValue<OverlayInterpolationProps>(() => ({
		progress: relativeProgress.value,
		layouts: { screen },
		insets,
	}));

	// Get focused scene for meta and route info
	const focusedScene = scenes[focusedIndex] ?? scene;

	if (!OverlayComponent) {
		return <>{children}</>;
	}

	const overlayProps: ContainerOverlayProps<
		typeof scene.descriptor.navigation
	> = {
		children,
		routes,
		overlayAnimation,
		// screenAnimation is not available at container level, pass a placeholder
		screenAnimation: overlayAnimation as unknown as ReturnType<
			typeof useScreenAnimation
		>,
		focusedRoute: focusedScene.route,
		focusedIndex,
		meta: focusedScene.descriptor.options.meta,
		navigation: scene.descriptor.navigation,
	};

	return <OverlayComponent {...overlayProps} />;
});

/**
 * Container overlay component that wraps all screen content.
 * Receives children (the screens) and passes them to the overlay component.
 */
export function ContainerOverlay({ children }: { children: React.ReactNode }) {
	const { scenes, flags } = useStack();

	const activeOverlay = useMemo(
		() => getActiveContainerOverlay(scenes, flags.TRANSITIONS_ALWAYS_ON),
		[scenes, flags.TRANSITIONS_ALWAYS_ON],
	);

	// If no container overlay, just render children directly
	if (!activeOverlay) {
		return <>{children}</>;
	}

	const { scene, overlayIndex } = activeOverlay;

	return (
		<ContainerOverlayHost
			scene={scene}
			scenes={scenes}
			overlayIndex={overlayIndex}
		>
			{children}
		</ContainerOverlayHost>
	);
}
