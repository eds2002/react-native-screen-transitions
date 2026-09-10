import type { SharedValue } from "react-native-reanimated";
import type { OrchestratorState } from "../../../providers/screen/orchestrator/orchestrator.provider";
import type { FloatOverlayEntry } from "./get-active-overlay";

export type ReadyOverlayResources = {
	overlayAnimationStore: OrchestratorState;
	driverScene: FloatOverlayEntry["scene"];
	driverAnimationStore: OrchestratorState;
	driverIsScreenReady: SharedValue<boolean>;
};

export function retainReadyOverlayResources(
	previous: ReadyOverlayResources | null,
	overlayAnimationStore: OrchestratorState | null,
	driverScene: FloatOverlayEntry["scene"],
	driverAnimationStore: OrchestratorState | null,
	driverIsScreenReady: SharedValue<boolean> | null,
): ReadyOverlayResources | null {
	if (!overlayAnimationStore || !driverAnimationStore || !driverIsScreenReady) {
		return previous;
	}

	if (
		previous?.overlayAnimationStore === overlayAnimationStore &&
		previous.driverScene === driverScene &&
		previous.driverAnimationStore === driverAnimationStore &&
		previous.driverIsScreenReady === driverIsScreenReady
	) {
		return previous;
	}

	return {
		overlayAnimationStore,
		driverScene,
		driverAnimationStore,
		driverIsScreenReady,
	};
}
