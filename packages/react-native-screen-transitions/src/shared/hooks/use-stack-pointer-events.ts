import { useStackCoreContext } from "../providers/stack/core.provider";
import { StackType } from "../types/stack.types";

/**
 * Hook that returns the appropriate pointer events value based on current stack type.
 *
 * - Component stack: "box-none" (allows touch pass-through to content behind)
 * - Other stacks: undefined (default behavior, view receives touches)
 *
 * Must be used within a StackCoreProvider.
 */
export function useStackPointerEvents(): "box-none" | undefined {
	const { flags } = useStackCoreContext();
	return flags.STACK_TYPE === StackType.COMPONENT ? "box-none" : undefined;
}
