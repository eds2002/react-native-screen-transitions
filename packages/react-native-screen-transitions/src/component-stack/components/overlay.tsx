import { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useScreenAnimation } from "../../shared/hooks/animation/use-screen-animation";
import { KeysProvider, useKeys } from "../../shared/providers/keys.provider";
import { TransitionStylesProvider } from "../../shared/providers/transition-styles.provider";
import { useOverlayAnimation } from "../hooks/use-overlay-animation";
import type {
	ComponentStackDescriptor,
	ComponentStackOverlayProps,
	ComponentStackScene,
} from "../types";
import { useComponentNavigationContext } from "../utils/with-component-navigation";

// Helper to cast component descriptors for KeysProvider
const asAny = (descriptor: ComponentStackDescriptor | undefined) =>
	descriptor as any;

type OverlayHostProps = {
	scene: ComponentStackScene;
	isFloating?: boolean;
};

const getActiveFloatOverlay = (scenes: ComponentStackScene[], index: number) => {
	if (scenes.length === 0) {
		return null;
	}

	// When navigating back, closing scenes are kept at the top of the local stack
	// while the focused index already points to the destination screen. We need to
	// start scanning from the actual top of the stack so the overlay can animate
	// out together with its closing screen instead of disappearing immediately.
	const startIndex = Math.max(index, scenes.length - 1);

	for (let i = startIndex; i >= 0; i--) {
		const scene = scenes[i];
		const options = scene?.descriptor?.options;

		if (options?.overlayMode === "float" && options?.overlayShown) {
			return { scene, overlayIndex: i };
		}
	}

	return null;
};

const OverlayHost = ({ scene, isFloating }: OverlayHostProps) => {
	const OverlayComponent = scene.descriptor.options.overlay;

	const { overlayAnimation, optimisticActiveIndex } = useOverlayAnimation();
	const { scenes, routes, navigation } = useComponentNavigationContext();

	const overlaySceneIndex = useMemo(() => {
		return scenes.findIndex(
			(stackScene) => stackScene.route.key === scene.route.key,
		);
	}, [scenes, scene.route.key]);

	const focusedScene = useMemo(() => {
		if (overlaySceneIndex === -1) {
			return scene;
		}

		const maxOffset = Math.max(scenes.length - overlaySceneIndex - 1, 0);
		const normalizedIndex = Math.min(
			Math.max(optimisticActiveIndex, 0),
			maxOffset,
		);

		return scenes[overlaySceneIndex + normalizedIndex] ?? scene;
	}, [overlaySceneIndex, optimisticActiveIndex, scenes, scene]);

	const screenAnimation = useScreenAnimation();

	if (!OverlayComponent) {
		return null;
	}

	const overlayProps: ComponentStackOverlayProps = {
		routes,
		overlayAnimation,
		screenAnimation,
		focusedRoute: focusedScene.route,
		focusedIndex: optimisticActiveIndex,
		meta: focusedScene.descriptor.options.meta,
		navigation,
	};

	return (
		<Animated.View
			pointerEvents="box-none"
			style={[
				styles.container,
				isFloating ? styles.floating : { zIndex: 1 },
				styles.absolute,
			]}
		>
			<View pointerEvents="box-none" style={styles.overlay}>
				<OverlayComponent {...overlayProps} />
			</View>
		</Animated.View>
	);
};

const FloatOverlay = () => {
	const { scenes, focusedIndex } = useComponentNavigationContext();

	const activeOverlay = useMemo(
		() => getActiveFloatOverlay(scenes, focusedIndex),
		[scenes, focusedIndex],
	);

	if (!activeOverlay) {
		return null;
	}

	const { scene, overlayIndex } = activeOverlay;

	const previous = scenes[overlayIndex - 1]?.descriptor;
	const current = scene.descriptor;
	const next = scenes[overlayIndex + 1]?.descriptor;

	return (
		<KeysProvider current={asAny(current)} previous={asAny(previous)} next={asAny(next)}>
			<TransitionStylesProvider>
				<OverlayHost scene={scene} isFloating />
			</TransitionStylesProvider>
		</KeysProvider>
	);
};

const ScreenOverlay = () => {
	// Cast since component-stack descriptors don't match React Navigation's type
	const { current } = useKeys() as unknown as { current: ComponentStackDescriptor };

	const options = current.options;

	if (!options.overlayShown || options.overlayMode !== "screen") {
		return null;
	}

	const scene: ComponentStackScene = {
		descriptor: current,
		route: current.route,
	};

	return <OverlayHost scene={scene} />;
};

export const Overlay = {
	Float: FloatOverlay,
	Screen: ScreenOverlay,
};

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
