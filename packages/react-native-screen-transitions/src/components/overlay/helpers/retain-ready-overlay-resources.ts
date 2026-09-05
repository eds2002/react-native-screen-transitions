import type { SharedValue } from "react-native-reanimated";
import type { OrchestratorState } from "../../../providers/screen/orchestrator/orchestrator.provider";
import type { FloatOverlayEntry } from "./get-active-overlay";

export type ReadyOverlayResources = {
	overlayAnimationStore: OrchestratorState;
	driverScene: FloatOverlayEntry["scene"];
	driverAnimationStore: OrchestratorState;
	driverScreenReady: SharedValue<number>;
};

export function retainReadyOverlayResources(
	previous: ReadyOverlayResources | null,
	overlayAnimationStore: OrchestratorState | null,
	driverScene: FloatOverlayEntry["scene"],
	driverAnimationStore: OrchestratorState | null,
	driverScreenReady: SharedValue<number> | null,
): ReadyOverlayResources | null {
	if (!overlayAnimationStore || !driverAnimationStore || !driverScreenReady) {
		return previous;
	}

	if (
		previous?.overlayAnimationStore === overlayAnimationStore &&
		previous.driverScene === driverScene &&
		previous.driverAnimationStore === driverAnimationStore &&
		previous.driverScreenReady === driverScreenReady
	) {
		return previous;
	}

	return {
		overlayAnimationStore,
		driverScene,
		driverAnimationStore,
		driverScreenReady,
	};
}
