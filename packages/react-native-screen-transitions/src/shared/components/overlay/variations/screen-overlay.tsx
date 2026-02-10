import { useMemo } from "react";
import { snapDescriptorToIndex } from "../../../animation/snap-to";
import {
	type StackDescriptor,
	type StackScene,
	useStack,
} from "../../../hooks/navigation/use-stack";
import { useKeys } from "../../../providers/screen/keys.provider";
import type { OverlayProps } from "../../../types/overlay.types";
import { OverlayHost } from "./overlay-host";

type OverlayScreenState = Omit<
	OverlayProps<StackDescriptor["navigation"]>,
	"progress" | "overlayAnimation" | "screenAnimation"
> & {
	index: number;
	snapTo: (index: number) => void;
};

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
	const { flags, routes, focusedIndex, routeKeys } = useStack();

	const options = current.options;

	const scene = useMemo<StackScene>(
		() => ({
			descriptor: current,
			route: current.route,
		}),
		[current],
	);

	const overlayScreenState = useMemo<OverlayScreenState>(
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

	if (!options.overlayShown || options.overlayMode !== "screen") {
		return null;
	}

	return <OverlayHost scene={scene} overlayScreenState={overlayScreenState} />;
}
