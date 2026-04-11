export const POINTER_EVENTS_NONE = "none" as const;
export const POINTER_EVENTS_BOX_NONE = "box-none" as const;

export type ActivityMode = "normal" | "inert" | "paused";
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
	inactiveBehavior: InactiveBehavior;
}

export interface NativeScreenLifecycle {
	visible: boolean;
	mode: ActivityMode;
}

interface NativeScreenUnmountInput {
	inactiveBehavior: InactiveBehavior;
	visible: boolean;
	hasNestedState: boolean;
}

interface NativeScreenPointerEventsInput {
	isClosing: boolean;
	isActive: boolean;
	isAllowedPassthroughBelow: boolean;
}

export function resolveNativeScreenLifecycle(
	input: NativeScreenLifecycleInput,
): NativeScreenLifecycle {
	"worklet";

	const {
		index,
		routesLength,
		isPreloaded,
		focusedIndex,
		isClosing,
		nextBackdropBehavior,
		inactiveBehavior,
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
		return {
			visible: true,
			mode: "normal",
		};
	}

	if (shouldStayVisible) {
		return {
			visible: true,
			mode: "inert",
		};
	}

	const mode: ActivityMode = inactiveBehavior === "none" ? "inert" : "paused";

	return {
		visible: false,
		mode,
	};
}

export function shouldUnmountNativeScreen({
	inactiveBehavior,
	visible,
	hasNestedState,
}: NativeScreenUnmountInput): boolean {
	return inactiveBehavior === "unmount" && !visible && !hasNestedState;
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
