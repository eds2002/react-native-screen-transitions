import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../../../../../types/animation.types";
import { shouldSlotInherit } from "../../constants";
import { materializeResolvedSlot } from "./materialize-slot";
import { getResolvedSlotState, hasDisappearedKeys } from "./slot-state";
import type {
	ResettableStyleState,
	ResettableStyleStatesBySlot,
} from "./types";

export type { ResettableStyleStatesBySlot } from "./types";

type ResolveSlotStylesContext = {
	currentStylesMap: NormalizedTransitionInterpolatedStyle;
	ancestorStylesMap: NormalizedTransitionInterpolatedStyle;
	previousStyleStatesBySlot: ResettableStyleStatesBySlot;
	deferLocalSlotResets: boolean;
	resolvedStylesMap: NormalizedTransitionInterpolatedStyle;
	nextPreviousStyleStatesBySlot: ResettableStyleStatesBySlot;
};

const getForwardedSlot = (
	slot: NormalizedTransitionSlotStyle | undefined,
	hasAnyKeys: boolean,
) => {
	"worklet";

	if (!hasAnyKeys) {
		return undefined;
	}

	return slot;
};

const hasEitherResetPatch = (
	hasStyleResetPatch: boolean,
	hasPropResetPatch: boolean,
) => {
	"worklet";
	return hasStyleResetPatch || hasPropResetPatch;
};

const getResolvedSlotOutput = ({
	slot,
	previousState,
	resetDroppedKeys,
	carryPreviousState,
}: {
	slot: NormalizedTransitionSlotStyle | undefined;
	previousState: ResettableStyleState | undefined;
	resetDroppedKeys: boolean;
	carryPreviousState: boolean;
}) => {
	"worklet";
	const state = getResolvedSlotState(slot);

	const hasStyleResetPatch =
		resetDroppedKeys &&
		hasDisappearedKeys(previousState?.styleKeys, state.styleKeys);
	const hasPropResetPatch =
		resetDroppedKeys &&
		hasDisappearedKeys(previousState?.propKeys, state.propKeys);
	const hasResetPatch = hasEitherResetPatch(
		hasStyleResetPatch,
		hasPropResetPatch,
	);
	const nextState =
		state.nextState ?? (carryPreviousState ? previousState : undefined);

	if (!hasResetPatch) {
		return {
			resolvedSlot: getForwardedSlot(slot, state.hasAnyKeys),
			nextState,
		};
	}

	return {
		resolvedSlot: materializeResolvedSlot({
			baseStyle: state.baseStyle,
			baseProps: state.baseProps,
			previousState,
			styleKeys: state.styleKeys,
			propKeys: state.propKeys,
			hasAnyStyleKeys: state.hasAnyStyleKeys,
			hasAnyPropKeys: state.hasAnyPropKeys,
			hasStyleResetPatch,
			hasPropResetPatch,
		}),
		nextState,
	};
};

const shouldDeferMissingLocalSlotReset = (
	context: ResolveSlotStylesContext,
	slotId: string,
) => {
	"worklet";
	const canInherit = shouldSlotInherit(slotId);
	const hasCurrentSlot = context.currentStylesMap[slotId] !== undefined;
	const hasInheritedSlot =
		canInherit && context.ancestorStylesMap[slotId] !== undefined;

	return (
		context.deferLocalSlotResets &&
		!canInherit &&
		!hasCurrentSlot &&
		!hasInheritedSlot
	);
};

const getSlotForId = (context: ResolveSlotStylesContext, slotId: string) => {
	"worklet";
	const currentSlot = context.currentStylesMap[slotId];

	if (currentSlot !== undefined) {
		return currentSlot;
	}

	if (shouldSlotInherit(slotId)) {
		return context.ancestorStylesMap[slotId];
	}

	return undefined;
};

const writeResolvedSlotOutput = ({
	context,
	slotId,
	resolvedSlot,
	nextState,
}: {
	context: ResolveSlotStylesContext;
	slotId: string;
	resolvedSlot: NormalizedTransitionSlotStyle | undefined;
	nextState: ResettableStyleState | undefined;
}) => {
	"worklet";

	if (nextState) {
		context.nextPreviousStyleStatesBySlot[slotId] = nextState;
	}

	if (!resolvedSlot) {
		return;
	}

	context.resolvedStylesMap[slotId] = resolvedSlot;
};

const areTransformItemsEqual = (left: unknown, right: unknown): boolean => {
	"worklet";
	if (left === right) {
		return true;
	}

	if (
		typeof left !== "object" ||
		left === null ||
		typeof right !== "object" ||
		right === null
	) {
		return false;
	}

	const leftObject = left as Record<string, unknown>;
	const rightObject = right as Record<string, unknown>;

	for (const key in leftObject) {
		if (leftObject[key] !== rightObject[key]) {
			return false;
		}
	}

	for (const key in rightObject) {
		if (!(key in leftObject)) {
			return false;
		}
	}

	return true;
};

const areTransformArraysEqual = (left: unknown, right: unknown): boolean => {
	"worklet";
	if (left === right) {
		return true;
	}

	if (!Array.isArray(left) || !Array.isArray(right)) {
		return false;
	}

	if (left.length !== right.length) {
		return false;
	}

	for (let i = 0; i < left.length; i++) {
		if (!areTransformItemsEqual(left[i], right[i])) {
			return false;
		}
	}

	return true;
};

const areFlatObjectsEqual = (left: unknown, right: unknown): boolean => {
	"worklet";
	if (left === right) {
		return true;
	}

	if (
		typeof left !== "object" ||
		left === null ||
		typeof right !== "object" ||
		right === null ||
		Array.isArray(left) ||
		Array.isArray(right)
	) {
		return false;
	}

	const leftObject = left as Record<string, unknown>;
	const rightObject = right as Record<string, unknown>;

	for (const key in leftObject) {
		const leftValue = leftObject[key];
		const rightValue = rightObject[key];

		if (key === "transform") {
			if (!areTransformArraysEqual(leftValue, rightValue)) {
				return false;
			}
			continue;
		}

		if (!areTransformItemsEqual(leftValue, rightValue)) {
			return false;
		}
	}

	for (const key in rightObject) {
		if (!(key in leftObject)) {
			return false;
		}
	}

	return true;
};

const areSlotsEqual = (
	left: NormalizedTransitionSlotStyle | undefined,
	right: NormalizedTransitionSlotStyle | undefined,
) => {
	"worklet";
	if (left === right) {
		return true;
	}

	if (!left || !right) {
		return false;
	}

	return (
		areFlatObjectsEqual(left.style, right.style) &&
		areFlatObjectsEqual(left.props, right.props)
	);
};

export const reuseEqualResolvedSlots = ({
	resolvedStylesMap,
	previousResolvedStylesMap,
}: {
	resolvedStylesMap: NormalizedTransitionInterpolatedStyle;
	previousResolvedStylesMap: NormalizedTransitionInterpolatedStyle;
}): NormalizedTransitionInterpolatedStyle => {
	"worklet";
	let changed = false;
	const stableStylesMap: NormalizedTransitionInterpolatedStyle = {};

	for (const slotId in resolvedStylesMap) {
		const nextSlot = resolvedStylesMap[slotId];
		const previousSlot = previousResolvedStylesMap[slotId];

		if (areSlotsEqual(nextSlot, previousSlot)) {
			stableStylesMap[slotId] = previousSlot;
			continue;
		}

		changed = true;
		stableStylesMap[slotId] = nextSlot;
	}

	for (const slotId in previousResolvedStylesMap) {
		if (!(slotId in resolvedStylesMap)) {
			changed = true;
			break;
		}
	}

	return changed ? stableStylesMap : previousResolvedStylesMap;
};

const appendResolvedSlot = (
	context: ResolveSlotStylesContext,
	slotId: string,
) => {
	"worklet";
	const shouldDeferReset = shouldDeferMissingLocalSlotReset(context, slotId);
	const { resolvedSlot, nextState } = getResolvedSlotOutput({
		slot: getSlotForId(context, slotId),
		previousState: context.previousStyleStatesBySlot[slotId],
		resetDroppedKeys: !shouldDeferReset,
		carryPreviousState: shouldDeferReset,
	});

	writeResolvedSlotOutput({
		context,
		slotId,
		resolvedSlot,
		nextState,
	});
};

const appendCurrentSlots = (context: ResolveSlotStylesContext) => {
	"worklet";

	for (const slotId in context.currentStylesMap) {
		appendResolvedSlot(context, slotId);
	}
};

const shouldAppendInheritedSlot = (
	context: ResolveSlotStylesContext,
	slotId: string,
) => {
	"worklet";
	return (
		shouldSlotInherit(slotId) && context.currentStylesMap[slotId] === undefined
	);
};

const appendInheritedSlots = (context: ResolveSlotStylesContext) => {
	"worklet";

	for (const slotId in context.ancestorStylesMap) {
		if (shouldAppendInheritedSlot(context, slotId)) {
			appendResolvedSlot(context, slotId);
		}
	}
};

const shouldAppendPreviousSlot = (
	context: ResolveSlotStylesContext,
	slotId: string,
) => {
	"worklet";
	const inheritedSlotExists =
		shouldSlotInherit(slotId) &&
		context.ancestorStylesMap[slotId] !== undefined;

	return context.currentStylesMap[slotId] === undefined && !inheritedSlotExists;
};

const appendPreviousSlots = (context: ResolveSlotStylesContext) => {
	"worklet";

	for (const slotId in context.previousStyleStatesBySlot) {
		if (shouldAppendPreviousSlot(context, slotId)) {
			appendResolvedSlot(context, slotId);
		}
	}
};

/**
 * Resolves slot styles for the current screen pass and resets keys a slot
 * emitted previously but no longer returns. Reanimated does not reliably clear
 * animated values with undefined, so known keys and numeric values are reset to
 * concrete identity values.
 */
export const resolveSlotStyles = ({
	currentStylesMap,
	ancestorStylesMap,
	previousStyleStatesBySlot,
	deferLocalSlotResets = false,
}: {
	currentStylesMap: NormalizedTransitionInterpolatedStyle;
	ancestorStylesMap: NormalizedTransitionInterpolatedStyle;
	previousStyleStatesBySlot: ResettableStyleStatesBySlot;
	deferLocalSlotResets?: boolean;
}) => {
	"worklet";
	const resolvedStylesMap: NormalizedTransitionInterpolatedStyle = {};
	const nextPreviousStyleStatesBySlot: ResettableStyleStatesBySlot = {};
	const context = {
		currentStylesMap,
		ancestorStylesMap,
		previousStyleStatesBySlot,
		deferLocalSlotResets,
		resolvedStylesMap,
		nextPreviousStyleStatesBySlot,
	};

	appendCurrentSlots(context);
	appendInheritedSlots(context);
	appendPreviousSlots(context);

	return {
		resolvedStylesMap,
		nextPreviousStyleStatesBySlot,
	};
};
