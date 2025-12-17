import {
	NavigationContext,
	NavigationRouteContext,
	type Route,
} from "@react-navigation/native";
import { useMemo } from "react";
import { Animated, StyleSheet, useWindowDimensions, View } from "react-native";
import { useDerivedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScreenAnimation } from "../hooks/animation/use-screen-animation";
import { useSharedValueState } from "../hooks/reanimated/use-shared-value-state";
import { KeysProvider, useKeys } from "../providers/keys.provider";
import { useStackRootContext } from "../providers/stack-root.provider";
import { TransitionStylesProvider } from "../providers/transition-styles.provider";
import type { OverlayInterpolationProps } from "../types/animation.types";
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
	const screen = useWindowDimensions();

	const { stackProgress, optimisticFocusedIndex, routeKeys } =
		useStackRootContext();
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
	transitionsAlwaysOn: boolean,
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

		// Skip screens without enableTransitions (native-stack only)
		if (!transitionsAlwaysOn && !options?.enableTransitions) {
			continue;
		}

		if (options?.overlayMode === "float" && options?.overlayShown) {
			return { scene, overlayIndex: i };
		}
	}

	return null;
}

/**
 * Float overlay component that renders above all screens.
 * Gets scenes and routes from stack-root context.
 */
export function FloatOverlay() {
	const { props, flags } = useStackRootContext<StackRootProps>();

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
		() =>
			getActiveFloatOverlay(scenes, focusedIndex, flags.TRANSITIONS_ALWAYS_ON),
		[scenes, focusedIndex, flags.TRANSITIONS_ALWAYS_ON],
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

/**
 * Screen overlay component that renders per-screen.
 * Gets current descriptor from keys context.
 */
export function ScreenOverlay() {
	const { current } = useKeys<BaseOverlayDescriptor>();
	const { routeKeys, flags } = useStackRootContext();

	const options = current.options;

	// Skip screens without enableTransitions (native-stack only)
	if (!flags.TRANSITIONS_ALWAYS_ON && !options.enableTransitions) {
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
