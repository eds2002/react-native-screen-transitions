import { useMemo } from "react";
import {
	type StackDescriptor,
	type StackScene,
	useStack,
} from "../../../hooks/navigation/use-stack";
import { useKeys } from "../../../providers/screen/keys.provider";
import { OverlayHost } from "./overlay-host";

/**
 * Screen overlay component that renders per-screen.
 * Gets current descriptor from keys context.
 */
export function ScreenOverlay() {
	const { current } = useKeys<StackDescriptor>();
	const { routeKeys, flags } = useStack();

	const options = current.options;

	const scene = useMemo<StackScene>(
		() => ({
			descriptor: current,
			route: current.route,
		}),
		[current],
	);

	// Find the index of this screen in the stack
	const overlayIndex = useMemo(
		() => routeKeys.indexOf(current.route.key),
		[routeKeys, current.route.key],
	);

	// Skip screens without enableTransitions (native-stack only)
	if (!flags.TRANSITIONS_ALWAYS_ON && !options.enableTransitions) {
		return null;
	}

	if (!options.overlayShown || options.overlayMode !== "screen") {
		return null;
	}

	return (
		<OverlayHost
			scene={scene}
			scenes={[scene]}
			routes={[]}
			overlayIndex={overlayIndex}
		/>
	);
}
