import { useBlankStackStore } from "../../../providers/stack/blank-stack.provider";
import { useStackCoreStore } from "../../../providers/stack/core.provider";

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
	const scenes = useBlankStackStore((store) => store.scenes);
	const transitionsAlwaysOn = useStackCoreStore(
		(store) => store.flags.TRANSITIONS_ALWAYS_ON,
	);

	const overlayStack = getFloatOverlayStack(scenes, transitionsAlwaysOn);
	if (overlayStack.length === 0) {
		return null;
	}

	const overlayTransitions = getFloatOverlayTransitions(overlayStack, scenes);

	return overlayTransitions.map(({ scene, driverScene }, layerIndex) => (
		<OverlayHost
			key={scene.route.key}
			scene={scene}
			driverScene={driverScene}
			previousOverlayScene={overlayTransitions[layerIndex - 1]?.scene}
			layerIndex={layerIndex}
		/>
	));
}
