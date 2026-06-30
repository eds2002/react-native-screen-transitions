import { useSyncExternalStore } from "react";
import type { ScreenKey } from "../../../../stores/bounds/types";
import type { ScreenSlotContextValue } from "../slot.provider";

/**
 * Screen-owned slot reference registry.
 *
 * This is important for portals: a teleported component can render outside the
 * screen provider that owns its active transition, but it still needs references
 * to that provider's shared values. This store does not copy or own styles; it
 * only exposes the existing ScreenSlotProvider value by screen key.
 */
type ScreenSlotsSnapshot = Record<ScreenKey, ScreenSlotContextValue>;

const listeners = new Set<() => void>();
const slotsByScreenKey = new Map<ScreenKey, ScreenSlotContextValue>();

let snapshot: ScreenSlotsSnapshot = {};

const emit = () => {
	snapshot = Object.fromEntries(slotsByScreenKey);

	for (const listener of listeners) {
		listener();
	}
};

export const registerScreenSlots = (
	screenKey: ScreenKey,
	slots: ScreenSlotContextValue,
) => {
	const previous = slotsByScreenKey.get(screenKey);
	if (
		previous?.localStylesMaps === slots.localStylesMaps &&
		previous.nextInterpolatorReady === slots.nextInterpolatorReady &&
		previous.slotsMap === slots.slotsMap
	) {
		return;
	}

	slotsByScreenKey.set(screenKey, slots);
	emit();
};

export const unregisterScreenSlots = (
	screenKey: ScreenKey,
	slots: ScreenSlotContextValue,
) => {
	if (slotsByScreenKey.get(screenKey) !== slots) {
		return;
	}

	slotsByScreenKey.delete(screenKey);
	emit();
};

const subscribe = (listener: () => void) => {
	listeners.add(listener);

	return () => {
		listeners.delete(listener);
	};
};

export const useRegisteredScreenSlots = (screenKey?: ScreenKey | null) => {
	return useSyncExternalStore(
		subscribe,
		() => (screenKey ? (snapshot[screenKey] ?? null) : null),
		() => null,
	);
};
