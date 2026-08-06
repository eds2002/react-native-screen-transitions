import { useStack } from "../../../hooks/navigation/use-stack";

import { getFloatOverlayStack } from "../helpers/get-active-overlay";
import { OverlayHost } from "./overlay-host";

/**
 * Float overlay component that renders above all screens.
 * Gets routes and descriptors from stack context.
 */
export function FloatOverlay() {
	const { scenes, flags } = useStack();

	const overlayStack = getFloatOverlayStack(
		scenes,
		flags.TRANSITIONS_ALWAYS_ON,
	);
	if (overlayStack.length === 0) {
		return null;
	}

	return overlayStack.map(({ scene, activity }, layerIndex) => (
		<OverlayHost
			key={scene.route.key}
			scene={scene}
			activity={activity}
			layerIndex={layerIndex}
		/>
	));
}
