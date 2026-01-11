import { useKeys } from "../providers/screen/keys.provider";
import { useStackCoreContext } from "../providers/stack/core.provider";
import { StackType } from "../types/stack.types";

type BackdropBehavior = "block" | "passthrough" | "dismiss";

interface BackdropPointerEventsResult {
	pointerEvents: "box-none" | undefined;
	backdropBehavior: BackdropBehavior;
}

/**
 * Returns pointer events and backdrop behavior based on screen options.
 *
 * - Explicit `backdropBehavior` option takes precedence
 * - Component stacks default to 'passthrough' (box-none)
 * - Other stacks default to 'block' (undefined = normal touch handling)
 */
export function useBackdropPointerEvents(): BackdropPointerEventsResult {
	const { current } = useKeys();
	const { flags } = useStackCoreContext();

	const isComponentStack = flags.STACK_TYPE === StackType.COMPONENT;
	const backdropBehavior: BackdropBehavior =
		current.options.backdropBehavior ??
		(isComponentStack ? "passthrough" : "block");

	const pointerEvents =
		backdropBehavior === "passthrough" ? "box-none" : undefined;

	return { pointerEvents, backdropBehavior };
}
