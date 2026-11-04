import { useBlankStackStore } from "../../navigators/blank-stack/state/blank-stack.provider";

import {
	getFloatOverlayStack,
	getFloatOverlayTransitions,
} from "./helpers/get-active-overlay";
import { OverlayHost } from "./variations/overlay-host";

/**
 * Overlay component that renders above all screens.
 * Gets routes and descriptors from stack context.
 */
export function Overlay() {
	const scenes = useBlankStackStore((store) => store.scenes);

	const overlayStack = getFloatOverlayStack(scenes);

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
