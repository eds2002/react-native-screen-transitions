import { useMemo } from "react";
import { snapDescriptorToIndex } from "../../../animation/snap-to";
import { useOptimisticFocusedIndex } from "../../../hooks/navigation/use-optimistic-focused-index";
import {
	type StackDescriptor,
	type StackScene,
	useStack,
} from "../../../hooks/navigation/use-stack";
import { useKeys } from "../../../providers/screen/keys";
import type { OverlayScreenState } from "../../../types/overlay.types";
import { isScreenOverlayVisible } from "../../../utils/overlay/visibility";
import { OverlayHost } from "./overlay-host";

/**
 * Screen overlay component that renders per-screen.
 * Gets current descriptor from keys context.
 *
 * @deprecated Screen overlays are deprecated. For per-screen overlays, render an
 * absolute-positioned view directly in your screen component and use `useScreenAnimation()`
 * to access animation values. This component will be removed in a future version.
 */
export function ScreenOverlay() {
	const { current } = useKeys<StackDescriptor>();
	const { flags, routes, optimisticFocusedIndex, routeKeys } = useStack();
	const focusedIndex = useOptimisticFocusedIndex(
		optimisticFocusedIndex,
		routeKeys.length,
	);

	const options = current.options;

	const scene = useMemo<StackScene>(
		() => ({
			descriptor: current,
			route: current.route,
		}),
		[current],
	);

	const overlayScreenState = useMemo<
		OverlayScreenState<StackDescriptor["navigation"]>
	>(
		() => ({
			index: routeKeys.indexOf(current.route.key),
			options: current.options,
			routes,
			focusedRoute: routes[focusedIndex] ?? current.route,
			focusedIndex,
			meta: current.options?.meta,
			navigation: current.navigation,
			snapTo: (index: number) => {
				snapDescriptorToIndex(current, index);
			},
		}),
		[current, routeKeys, routes, focusedIndex],
	);

	// Skip screens without enableTransitions (native-stack only)
	if (!flags.TRANSITIONS_ALWAYS_ON && !options.enableTransitions) {
		return null;
	}

	if (!isScreenOverlayVisible(options)) {
		return null;
	}

	return <OverlayHost scene={scene} overlayScreenState={overlayScreenState} />;
}
