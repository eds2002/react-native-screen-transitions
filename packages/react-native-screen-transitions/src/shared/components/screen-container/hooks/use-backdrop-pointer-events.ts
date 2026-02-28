import { useDescriptors } from "../../../providers/screen/descriptors";
import { useStackCoreContext } from "../../../providers/stack/core.provider";
import { StackType } from "../../../types/stack.types";

type BackdropBehavior = "block" | "passthrough" | "dismiss" | "collapse";

interface BackdropPointerEventsResult {
	pointerEvents: "box-none" | undefined;
	backdropBehavior: BackdropBehavior;
	isBackdropActive: boolean;
}

/**
 * Returns pointer events and backdrop behavior based on screen options.
 *
 * - Explicit `backdropBehavior` option takes precedence
 * - Component stacks default to 'passthrough' (box-none)
 * - Other stacks default to 'block' (undefined = normal touch handling)
 */
export function useBackdropPointerEvents(): BackdropPointerEventsResult {
	const { current } = useDescriptors();
	const { flags } = useStackCoreContext();

	const isComponentStack = flags.STACK_TYPE === StackType.COMPONENT;
	const backdropBehavior: BackdropBehavior =
		current.options.backdropBehavior ??
		(isComponentStack ? "passthrough" : "block");

	const pointerEvents =
		backdropBehavior === "passthrough" ? "box-none" : undefined;

	const isBackdropActive =
		backdropBehavior === "dismiss" || backdropBehavior === "collapse";

	return { pointerEvents, backdropBehavior, isBackdropActive };
}
