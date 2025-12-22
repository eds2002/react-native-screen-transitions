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
 *
 * @deprecated Screen overlays are deprecated. For per-screen overlays, render an
 * absolute-positioned view directly in your screen component and use `useScreenAnimation()`
 * to access animation values. This component will be removed in a future version.
 */
export function ScreenOverlay() {
	const { current } = useKeys<StackDescriptor>();
	const { flags } = useStack();

	const options = current.options;

	const scene = useMemo<StackScene>(
		() => ({
			descriptor: current,
			route: current.route,
		}),
		[current],
	);

	// Skip screens without enableTransitions (native-stack only)
	if (!flags.TRANSITIONS_ALWAYS_ON && !options.enableTransitions) {
		return null;
	}

	if (!options.overlayShown || options.overlayMode !== "screen") {
		return null;
	}

	return <OverlayHost scene={scene} />;
}
