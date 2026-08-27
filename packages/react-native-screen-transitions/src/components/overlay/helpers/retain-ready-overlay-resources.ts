import type { ScreenAnimationContextValue } from "../../../providers/screen/animation/animation.provider";
import type { ScreenSlotContextValue } from "../../../providers/screen/styles/slot.provider";
import type { FloatOverlayEntry } from "./get-active-overlay";

export type ReadyOverlayResources = {
	overlayAnimationStore: ScreenAnimationContextValue;
	overlaySlots: ScreenSlotContextValue;
	driverScene: FloatOverlayEntry["scene"];
	driverAnimationStore: ScreenAnimationContextValue;
	driverSlots: ScreenSlotContextValue;
};

export function retainReadyOverlayResources(
	previous: ReadyOverlayResources | null,
	overlayAnimationStore: ScreenAnimationContextValue | null,
	overlaySlots: ScreenSlotContextValue | null,
	driverScene: FloatOverlayEntry["scene"],
	driverAnimationStore: ScreenAnimationContextValue | null,
	driverSlots: ScreenSlotContextValue | null,
): ReadyOverlayResources | null {
	if (
		!overlayAnimationStore ||
		!overlaySlots ||
		!driverAnimationStore ||
		!driverSlots
	) {
		return previous;
	}

	if (
		previous?.overlayAnimationStore === overlayAnimationStore &&
		previous.overlaySlots === overlaySlots &&
		previous.driverScene === driverScene &&
		previous.driverAnimationStore === driverAnimationStore &&
		previous.driverSlots === driverSlots
	) {
		return previous;
	}

	return {
		overlayAnimationStore,
		overlaySlots,
		driverScene,
		driverAnimationStore,
		driverSlots,
	};
}
