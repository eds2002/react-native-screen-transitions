import {
	NavigationContext,
	NavigationRouteContext,
} from "@react-navigation/native";
import { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeysProvider, useKeys } from "../../shared/providers/keys";
import { useOverlayAnimation } from "../hooks/use-overlay-animation";
import type {
	BlankStackDescriptor,
	BlankStackOverlayProps,
	BlankStackScene,
} from "../types";
import { useStackNavigationContext } from "../utils/with-stack-navigation";

type OverlayHostProps = {
	scene: BlankStackScene;
	focusedIndex: number;
	isFloating?: boolean;
};

const getActiveFloatOverlay = (scenes: BlankStackScene[], index: number) => {
	for (let i = index; i >= 0; i--) {
		const scene = scenes[i];
		const options = scene?.descriptor?.options;

		if (options?.overlayMode === "float" && options?.overlayShown) {
			return { scene, overlayIndex: i };
		}
	}

	return null;
};

const OverlayHost = ({ scene, focusedIndex, isFloating }: OverlayHostProps) => {
	const insets = useSafeAreaInsets();

	const OverlayComponent = scene.descriptor.options.overlay;

	const animation = useOverlayAnimation();

	if (!OverlayComponent) {
		return null;
	}

	const overlayProps: BlankStackOverlayProps = {
		route: scene.route,
		navigation: scene.descriptor.navigation,
		animation,
		insets,
		focusedIndex,
	};

	return (
		<Animated.View
			pointerEvents="box-none"
			style={[
				styles.container,
				isFloating ? styles.floating : null,
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
			<OverlayHost scene={scene} focusedIndex={focusedIndex} isFloating />
		</KeysProvider>
	);
};

const ScreenOverlay = () => {
	const { focusedIndex } = useStackNavigationContext();
	const { current } = useKeys<BlankStackDescriptor>();

	const options = current.options;

	if (!options.overlayShown || options.overlayMode !== "screen") {
		return null;
	}

	const scene: BlankStackScene = {
		descriptor: current,
		route: current.route,
	};

	return <OverlayHost scene={scene} focusedIndex={focusedIndex} />;
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
