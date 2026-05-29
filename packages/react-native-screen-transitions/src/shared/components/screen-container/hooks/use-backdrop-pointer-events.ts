import { useState } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
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
 * - Blank stack defaults to 'block' (undefined = normal touch handling)
 */
export function useBackdropPointerEvents(): BackdropPointerEventsResult {
	const current = useDescriptorsStore((store) => store.descriptors.current);
	const screenOptions = useScreenOptionsStore((store) => store);
	const [runtimeBackdropBehavior, setRuntimeBackdropBehavior] = useState<
		BackdropBehavior | undefined
	>(undefined);

	useAnimatedReaction(
		() => screenOptions.get().backdropBehavior,
		(next, previous) => {
			"worklet";
			if (next !== previous) {
				runOnJS(setRuntimeBackdropBehavior)(next);
			}
		},
		[screenOptions],
	);

	const backdropBehavior: BackdropBehavior =
		runtimeBackdropBehavior ?? current.options.backdropBehavior ?? "block";

	const pointerEvents =
		backdropBehavior === "passthrough" ? "box-none" : undefined;

	const isBackdropActive =
		backdropBehavior === "dismiss" || backdropBehavior === "collapse";

	return { pointerEvents, backdropBehavior, isBackdropActive };
}
