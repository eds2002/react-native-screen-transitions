import { useState } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useDescriptorsStore } from "../../../providers/screen/descriptors";
import { useScreenOptionsStore } from "../../../providers/screen/options";
import type { BackdropBehavior } from "../../../types/screen.types";

interface BackdropPointerEventsResult {
	pointerEvents: "box-none" | undefined;
	backdropBehavior: BackdropBehavior;
	isBackdropActive: boolean;
}

/**
 * Returns pointer events and backdrop behavior based on screen options.
 *
 * - Runtime interpolator `backdropBehavior` takes precedence
 * - Explicit descriptor `backdropBehavior` option is next
 * - Otherwise defaults to 'block' (undefined = normal touch handling)
 */
export function useBackdropPointerEvents(): BackdropPointerEventsResult {
	const screenOptions = useScreenOptionsStore();
	const descriptorBackdropBehavior = useDescriptorsStore(
		(store) => store.options.backdropBehavior,
	);
	const [runtimeBackdropBehavior, setRuntimeBackdropBehavior] = useState<
		BackdropBehavior | undefined
	>(undefined);

	useAnimatedReaction(
		() => screenOptions.get().backdropBehavior,
		(next, previous) => {
			"worklet";
			if (next !== previous) {
				scheduleOnRN(setRuntimeBackdropBehavior, next);
			}
		},
		[screenOptions],
	);

	const backdropBehavior: BackdropBehavior =
		runtimeBackdropBehavior ?? descriptorBackdropBehavior ?? "block";

	const pointerEvents =
		backdropBehavior === "passthrough" ? "box-none" : undefined;

	const isBackdropActive =
		backdropBehavior === "dismiss" || backdropBehavior === "collapse";

	return { pointerEvents, backdropBehavior, isBackdropActive };
}
