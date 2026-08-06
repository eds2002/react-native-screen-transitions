import { useStack } from "../../../hooks/navigation/use-stack";

import {
	getFloatOverlayStack,
	getFloatOverlayTransitions,
} from "../helpers/get-active-overlay";
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

	const overlayTransitions = getFloatOverlayTransitions(overlayStack, scenes);

	return overlayTransitions.map(
		({ scene, activity, driverScene }, layerIndex) => (
			<OverlayHost
				key={scene.route.key}
				scene={scene}
				driverScene={driverScene}
				previousOverlayScene={overlayTransitions[layerIndex - 1]?.scene}
				activity={activity}
				layerIndex={layerIndex}
			/>
		),
	);
}
