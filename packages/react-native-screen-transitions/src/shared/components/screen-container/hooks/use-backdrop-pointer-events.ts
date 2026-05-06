import { useState } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { useDescriptors } from "../../../providers/screen/descriptors";
import { useScreenOptionsContext } from "../../../providers/screen/options";
import { useStackCoreContext } from "../../../providers/stack/core.provider";
import type { BackdropBehavior } from "../../../types/screen.types";
import { StackType } from "../../../types/stack.types";

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
 * - Component stacks default to 'passthrough' (box-none)
 * - Other stacks default to 'block' (undefined = normal touch handling)
 */
export function useBackdropPointerEvents(): BackdropPointerEventsResult {
	const { current } = useDescriptors();
	const screenOptions = useScreenOptionsContext();
	const { flags } = useStackCoreContext();
	const [runtimeBackdropBehavior, setRuntimeBackdropBehavior] = useState<
		BackdropBehavior | undefined
	>(undefined);

	useAnimatedReaction(
		() => screenOptions.backdropBehavior.get(),
		(next, previous) => {
			"worklet";
			if (next !== previous) {
				runOnJS(setRuntimeBackdropBehavior)(next);
			}
		},
		[screenOptions.backdropBehavior],
	);

	const isComponentStack = flags.STACK_TYPE === StackType.COMPONENT;
	const backdropBehavior: BackdropBehavior =
		runtimeBackdropBehavior ??
		current.options.backdropBehavior ??
		(isComponentStack ? "passthrough" : "block");

	const pointerEvents =
		backdropBehavior === "passthrough" ? "box-none" : undefined;

	const isBackdropActive =
		backdropBehavior === "dismiss" || backdropBehavior === "collapse";

	return { pointerEvents, backdropBehavior, isBackdropActive };
}
