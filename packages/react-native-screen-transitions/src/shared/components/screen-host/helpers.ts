export const POINTER_EVENTS_NONE = "none" as const;
export const POINTER_EVENTS_BOX_NONE = "box-none" as const;

/**
 * Structural screen state within the stack.
 *
 * - `interactive`: the top/focused screen, fully active
 * - `inert`: still part of the visible keep-alive window, but not interactive
 * - `inactive`: deeper than the inert screen unless another rule keeps it alive
 */
export type NativeScreenState = "interactive" | "inert" | "inactive";
export type InactiveBehavior = "pause" | "unmount" | "none";
export type PointerEventsMode =
	| typeof POINTER_EVENTS_NONE
	| typeof POINTER_EVENTS_BOX_NONE;

export interface NativeScreenLifecycleInput {
	index: number;
	routesLength: number;
	isPreloaded: boolean;
	focusedIndex: number;
	isClosing: number;
	nextBackdropBehavior?: "block" | "passthrough" | "dismiss" | "collapse";
}

interface NativeScreenUnmountInput {
	inactiveBehavior: InactiveBehavior;
	state: NativeScreenState;
	hasNestedState: boolean;
}

interface NativeScreenPointerEventsInput {
	isClosing: boolean;
	isActive: boolean;
	isAllowedPassthroughBelow: boolean;
}

export function resolveNativeScreenState(
	input: NativeScreenLifecycleInput,
): NativeScreenState {
	"worklet";

	const {
		index,
		routesLength,
		isPreloaded,
		focusedIndex,
		isClosing,
		nextBackdropBehavior,
	} = input;
	const topIndex = routesLength - 1;
	const isTop = index === topIndex;
	const isFocused = index === focusedIndex;
	const isBeforeLast = index === topIndex - 1;
	const keepsScreenBelowVisible =
		nextBackdropBehavior !== undefined && nextBackdropBehavior !== "block";
	const shouldStayVisible =
		isFocused ||
		isPreloaded ||
		keepsScreenBelowVisible ||
		isBeforeLast ||
		isClosing > 0;

	if (isTop || isFocused) {
		return "interactive";
	}

	if (shouldStayVisible) {
		return "inert";
	}

	return "inactive";
}

export function shouldUnmountNativeScreen({
	inactiveBehavior,
	state,
	hasNestedState,
}: NativeScreenUnmountInput): boolean {
	return (
		inactiveBehavior === "unmount" && state === "inactive" && !hasNestedState
	);
}

export function resolveNativeScreenPointerEvents({
	isClosing,
	isActive,
	isAllowedPassthroughBelow,
}: NativeScreenPointerEventsInput): PointerEventsMode {
	"worklet";

	return isClosing || (!isActive && !isAllowedPassthroughBelow)
		? POINTER_EVENTS_NONE
		: POINTER_EVENTS_BOX_NONE;
}
