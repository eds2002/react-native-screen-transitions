import { useState } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { useDescriptorsStore } from "../../../providers/screen/descriptors";
import { useScreenOptionsStore } from "../../../providers/screen/options";
import { useStackCoreStore } from "../../../providers/stack/core.provider";
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
	const screenOptions = useScreenOptionsStore();
	const descriptorBackdropBehavior = useDescriptorsStore(
		(store) => store.options.backdropBehavior,
	);
	const stackType = useStackCoreStore((store) => store.flags.STACK_TYPE);
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

	const isComponentStack = stackType === StackType.COMPONENT;
	const backdropBehavior: BackdropBehavior =
		runtimeBackdropBehavior ??
		descriptorBackdropBehavior ??
		(isComponentStack ? "passthrough" : "block");

	const pointerEvents =
		backdropBehavior === "passthrough" ? "box-none" : undefined;

	const isBackdropActive =
		backdropBehavior === "dismiss" || backdropBehavior === "collapse";

	return { pointerEvents, backdropBehavior, isBackdropActive };
}
