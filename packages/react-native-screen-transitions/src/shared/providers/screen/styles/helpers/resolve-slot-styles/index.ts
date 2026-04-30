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
}: {
	slot: NormalizedTransitionSlotStyle | undefined;
	previousState: ResettableStyleState | undefined;
}) => {
	"worklet";
	const state = getResolvedSlotState(slot);

	const hasStyleResetPatch = hasDisappearedKeys(
		previousState?.styleKeys,
		state.styleKeys,
	);
	const hasPropResetPatch = hasDisappearedKeys(
		previousState?.propKeys,
		state.propKeys,
	);
	const hasResetPatch = hasEitherResetPatch(
		hasStyleResetPatch,
		hasPropResetPatch,
	);

	if (!hasResetPatch) {
		return {
			resolvedSlot: getForwardedSlot(slot, state.hasAnyKeys),
			nextState: state.nextState,
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
		nextState: state.nextState,
	};
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

const appendResolvedSlot = (
	context: ResolveSlotStylesContext,
	slotId: string,
) => {
	"worklet";
	const { resolvedSlot, nextState } = getResolvedSlotOutput({
		slot: getSlotForId(context, slotId),
		previousState: context.previousStyleStatesBySlot[slotId],
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
}: {
	currentStylesMap: NormalizedTransitionInterpolatedStyle;
	ancestorStylesMap: NormalizedTransitionInterpolatedStyle;
	previousStyleStatesBySlot: ResettableStyleStatesBySlot;
}) => {
	"worklet";
	const resolvedStylesMap: NormalizedTransitionInterpolatedStyle = {};
	const nextPreviousStyleStatesBySlot: ResettableStyleStatesBySlot = {};
	const context = {
		currentStylesMap,
		ancestorStylesMap,
		previousStyleStatesBySlot,
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
