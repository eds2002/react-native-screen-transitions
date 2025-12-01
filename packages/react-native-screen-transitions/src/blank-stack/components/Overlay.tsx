import {
	NavigationContext,
	NavigationRouteContext,
} from "@react-navigation/native";
import { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScreenAnimation } from "../../shared/hooks/animation/use-screen-animation";
import { KeysProvider, useKeys } from "../../shared/providers/keys.provider";
import { useOverlayAnimation } from "../hooks/use-overlay-animation";
import type {
	BlankStackDescriptor,
	BlankStackOverlayProps,
	BlankStackScene,
} from "../types";
import { useStackNavigationContext } from "../utils/with-stack-navigation";

type OverlayHostProps = {
	scene: BlankStackScene;
	isFloating?: boolean;
};

const getActiveFloatOverlay = (scenes: BlankStackScene[], index: number) => {
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
	const insets = useSafeAreaInsets();

	const OverlayComponent = scene.descriptor.options.overlay;

	const { overlayAnimation, optimisticActiveIndex } = useOverlayAnimation();
	const { scenes } = useStackNavigationContext();

	const overlaySceneIndex = useMemo(() => {
		return scenes.findIndex(
			(stackScene) => stackScene.route.key === scene.route.key,
		);
	}, [scenes, scene.route.key]);

	const focusedRoute = useMemo(() => {
		if (overlaySceneIndex === -1) {
			return scene.route;
		}

		const maxOffset = Math.max(scenes.length - overlaySceneIndex - 1, 0);
		const normalizedIndex = Math.min(
			Math.max(optimisticActiveIndex, 0),
			maxOffset,
		);

		return scenes[overlaySceneIndex + normalizedIndex]?.route ?? scene.route;
	}, [overlaySceneIndex, optimisticActiveIndex, scenes, scene.route]);

	const screenAnimation = useScreenAnimation();

	if (!OverlayComponent) {
		return null;
	}

	const overlayProps: BlankStackOverlayProps = {
		route: scene.route,
		focusedRoute,
		navigation: scene.descriptor.navigation,
		overlayAnimation,
		screenAnimation,
		focusedIndex: optimisticActiveIndex,
		insets,
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
			<NavigationContext.Provider value={scene.descriptor.navigation}>
				<NavigationRouteContext.Provider value={scene.route}>
					<View pointerEvents="box-none" style={styles.overlay}>
						<OverlayComponent {...overlayProps} />
					</View>
				</NavigationRouteContext.Provider>
			</NavigationContext.Provider>
		</Animated.View>
	);
};

const FloatOverlay = () => {
	const { scenes, focusedIndex } = useStackNavigationContext();

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
		<KeysProvider current={current} previous={previous} next={next}>
			<OverlayHost scene={scene} isFloating />
		</KeysProvider>
	);
};

const ScreenOverlay = () => {
	const { current } = useKeys<BlankStackDescriptor>();

	const options = current.options;

	if (!options.overlayShown || options.overlayMode !== "screen") {
		return null;
	}

	const scene: BlankStackScene = {
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
