import { useMemo } from "react";
import type { ScreenHostValue } from "../../providers/host/screen-host.provider";
import type { BlankStackDescriptor } from "../../types/blank-stack.types";
import type { BaseStackScene } from "../../types/stack.types";
import { resolvePresentedIndex } from "./state/helpers/resolve-presented-index";
import type { NavigatorStoreValue } from "./state/navigator-store";
import { useBlankStackState } from "./state/use-blank-stack-state";
import type {
	TransitionNavigator,
	TransitionNavigatorProps,
	TransitionScene,
} from "./types";

interface NavigatorInternals {
	store: NavigatorStoreValue;
	host: ScreenHostValue;
}

const internals = new WeakMap<TransitionNavigator, NavigatorInternals>();

/** The stores a navigator value carries to `<TransitionNavigator>`. */
export function getNavigatorInternals(
	navigator: TransitionNavigator,
): NavigatorInternals {
	const value = internals.get(navigator);
	if (!value) {
		throw new Error(
			"TransitionNavigator expects the value returned by useTransitionNavigator.",
		);
	}
	return value;
}

const createScenesByKey = (scenes: BaseStackScene<BlankStackDescriptor>[]) => {
	const scenesByKey: Record<string, BaseStackScene<BlankStackDescriptor>> = {};
	for (const scene of scenes) {
		scenesByKey[scene.route.key] = scene;
	}
	return scenesByKey;
};

/**
 * Turns a React Navigation navigator's state into scenes the engine can animate: one motion unit per
 * route, closing routes kept until their close animation finishes, neighbours wired as
 * previous/next, gesture dismissal turned into a pop. Render the result with `<TransitionNavigator>`.
 *
 * ```tsx
 * const navigator = useTransitionNavigator({ state, navigation, descriptors });
 * return <TransitionNavigator value={navigator} />;
 * ```
 */
export function useTransitionNavigator(
	props: TransitionNavigatorProps,
): TransitionNavigator {
	const { state, handleCloseRoute, handleOpenRoute, requestDismiss } =
		useBlankStackState(props);

	const navigatorKey = props.state.key;
	const firstRouteKey = props.state.routes[0]?.key;
	const focusedIndex = resolvePresentedIndex(
		state.routes,
		state.focusedRouteKey,
		state.closingRouteKeys,
	);

	const scenesByKey = useMemo(
		() => createScenesByKey(state.scenes),
		[state.scenes],
	);

	// Each screen paints over the one two below it (the one directly below can be revealed by a drag).
	const paintDriverRouteKeyByRouteKey = useMemo(() => {
		const paintDrivers = new Map<string, string>();
		for (let index = 0; index + 2 < state.routeKeys.length; index++) {
			paintDrivers.set(state.routeKeys[index], state.routeKeys[index + 2]);
		}
		return paintDrivers;
	}, [state.routeKeys]);

	return useMemo(() => {
		const scenes = state.scenes as readonly TransitionScene[];
		const navigator: TransitionNavigator = {
			key: navigatorKey,
			scenes,
			focusedIndex,
			focused: scenes[focusedIndex],
		};
		internals.set(navigator, {
			store: {
				navigatorKey,
				routeKeys: state.routeKeys,
				routes: state.routes,
				scenes: state.scenes,
				scenesByKey,
				paintDriverRouteKeyByRouteKey,
				focusedIndex,
				requestDismiss,
				shouldShowFloatOverlay: state.shouldShowFloatOverlay,
				handleCloseRoute,
				handleOpenRoute,
			},
			host: {
				navigatorKey,
				routeKeys: state.routeKeys,
				scenes: state.scenes,
				scenesByKey,
				focusedIndex,
				firstRouteKey,
			},
		});
		return navigator;
	}, [
		state,
		navigatorKey,
		firstRouteKey,
		focusedIndex,
		scenesByKey,
		paintDriverRouteKeyByRouteKey,
		requestDismiss,
		handleCloseRoute,
		handleOpenRoute,
	]);
}
