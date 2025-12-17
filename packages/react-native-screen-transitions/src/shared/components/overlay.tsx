import {
	NavigationContext,
	NavigationRouteContext,
	type Route,
} from "@react-navigation/native";
import { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useOverlayState } from "../hooks/animation/use-overlay-state";
import { useScreenAnimation } from "../hooks/animation/use-screen-animation";
import { KeysProvider, useKeys } from "../providers/keys.provider";
import { useStackRootContext } from "../providers/stack-root.provider";
import { TransitionStylesProvider } from "../providers/transition-styles.provider";
import type { OverlayProps } from "../types/core.types";

/**
 * Generic scene type for overlay components.
 */
type OverlayScene = {
	route: Route<string>;
	descriptor: BaseOverlayDescriptor;
};

/**
 * Base descriptor shape required for overlay functionality.
 */
type BaseOverlayDescriptor = {
	route: Route<string>;
	navigation: any;
	options: {
		overlay?: (props: OverlayProps<any>) => React.ReactNode;
		overlayMode?: "float" | "screen";
		overlayShown?: boolean;
		meta?: Record<string, unknown>;
		enableTransitions?: boolean;
	};
};

/**
 * Props shape expected from stack-root context.
 */
type StackRootProps = {
	state: {
		routes: Route<string>[];
		index: number;
	};
	descriptors: Record<string, BaseOverlayDescriptor>;
};

type OverlayHostProps = {
	scene: OverlayScene;
	scenes: OverlayScene[];
	routes: Route<string>[];
	overlayIndex: number;
	isFloating?: boolean;
};

function OverlayHost({
	scene,
	scenes,
	routes,
	overlayIndex,
	isFloating,
}: OverlayHostProps) {
	const OverlayComponent = scene.descriptor.options.overlay;

	// Use shared overlay state from root context
	const { overlayAnimation, optimisticActiveIndex } =
		useOverlayState(overlayIndex);

	const focusedScene = useMemo(() => {
		if (overlayIndex === -1) {
			return scene;
		}

		const maxOffset = Math.max(scenes.length - overlayIndex - 1, 0);
		const normalizedIndex = Math.min(
			Math.max(optimisticActiveIndex, 0),
			maxOffset,
		);

		return scenes[overlayIndex + normalizedIndex] ?? scene;
	}, [overlayIndex, optimisticActiveIndex, scenes, scene]);

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
}

function getActiveFloatOverlay(
	scenes: OverlayScene[],
	index: number,
	requireEnableTransitions: boolean,
): { scene: OverlayScene; overlayIndex: number } | null {
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

		// Check enableTransitions requirement (native-stack only)
		if (requireEnableTransitions && !options?.enableTransitions) {
			continue;
		}

		if (options?.overlayMode === "float" && options?.overlayShown) {
			return { scene, overlayIndex: i };
		}
	}

	return null;
}

export type FloatOverlayProps = {
	/**
	 * Whether to require enableTransitions option (native-stack only)
	 */
	requireEnableTransitions?: boolean;
};

/**
 * Float overlay component that renders above all screens.
 * Gets scenes and routes from stack-root context.
 */
export function FloatOverlay({
	requireEnableTransitions = false,
}: FloatOverlayProps = {}) {
	const { props } = useStackRootContext<StackRootProps>();

	const { scenes, routes, focusedIndex } = useMemo(() => {
		const scenes: OverlayScene[] = [];
		const routes = props.state.routes;

		for (const route of routes) {
			const descriptor = props.descriptors[route.key];
			if (descriptor) {
				scenes.push({ route, descriptor });
			}
		}

		return {
			scenes,
			routes,
			focusedIndex: props.state.index,
		};
	}, [props.state.routes, props.state.index, props.descriptors]);

	const activeOverlay = useMemo(
		() => getActiveFloatOverlay(scenes, focusedIndex, requireEnableTransitions),
		[scenes, focusedIndex, requireEnableTransitions],
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
			<TransitionStylesProvider>
				<OverlayHost
					scene={scene}
					scenes={scenes}
					routes={routes}
					overlayIndex={overlayIndex}
					isFloating
				/>
			</TransitionStylesProvider>
		</KeysProvider>
	);
}

export type ScreenOverlayProps = {
	/**
	 * Whether to require enableTransitions option (native-stack only)
	 */
	requireEnableTransitions?: boolean;
};

/**
 * Screen overlay component that renders per-screen.
 * Gets current descriptor from keys context.
 */
export function ScreenOverlay({
	requireEnableTransitions = false,
}: ScreenOverlayProps = {}) {
	const { current } = useKeys<BaseOverlayDescriptor>();
	const { routeKeys } = useStackRootContext();

	const options = current.options;

	// Check enableTransitions requirement (native-stack only)
	if (requireEnableTransitions && !options.enableTransitions) {
		return null;
	}

	if (!options.overlayShown || options.overlayMode !== "screen") {
		return null;
	}

	const scene: OverlayScene = {
		descriptor: current,
		route: current.route,
	};

	// Find the index of this screen in the stack
	const overlayIndex = routeKeys.indexOf(current.route.key);

	return (
		<OverlayHost
			scene={scene}
			scenes={[scene]}
			routes={[]}
			overlayIndex={overlayIndex}
		/>
	);
}

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
