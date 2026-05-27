import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../../../../../types/animation.types";
import { shouldSlotInherit } from "../../constants";
import { materializeResolvedSlot } from "./materialize-slot";
import { getResolvedSlotState } from "./slot-state";
import type {
	LocalStyleLayers,
	ResettableStyleState,
	ResettableStyleStatesBySlot,
} from "./types";

export type { LocalStyleLayers, ResettableStyleStatesBySlot } from "./types";

type ResolveSlotStylesContext = {
	localStylesMaps: LocalStyleLayers;
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

const hasDefinedBucketValue = (value: unknown) => {
	"worklet";
	return value !== undefined && value !== null;
};

const hasResettableDisappearedKeys = (
	previousKeys: Record<string, true> | undefined,
	previousResetValues: Record<string, unknown> | undefined,
	currentKeys: Record<string, true> | undefined,
) => {
	"worklet";

	if (!previousKeys || !previousResetValues) {
		return false;
	}

	for (const key in previousKeys) {
		if (currentKeys !== undefined && currentKeys[key] === true) {
			continue;
		}

		if (previousResetValues[key] !== undefined) {
			return true;
		}
	}

	return false;
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
		hasResettableDisappearedKeys(
			previousState?.styleKeys,
			previousState?.styleResetValues,
			state.styleKeys,
		);
	const hasPropResetPatch =
		resetDroppedKeys &&
		hasResettableDisappearedKeys(
			previousState?.propKeys,
			previousState?.propResetValues,
			state.propKeys,
		);
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

const hasLocalStyleSource = (context: ResolveSlotStylesContext) => {
	"worklet";
	return context.localStylesMaps.length > 0;
};

const hasLocalSlot = (context: ResolveSlotStylesContext, slotId: string) => {
	"worklet";

	for (let index = 0; index < context.localStylesMaps.length; index++) {
		if (context.localStylesMaps[index]?.[slotId] !== undefined) {
			return true;
		}
	}

	return false;
};

const shouldDeferMissingLocalSlotReset = (
	context: ResolveSlotStylesContext,
	slotId: string,
) => {
	"worklet";
	const canInherit = shouldSlotInherit(slotId);
	const localSlotExists = hasLocalSlot(context, slotId);
	const hasInheritedSlot =
		canInherit && context.ancestorStylesMap[slotId] !== undefined;

	return (
		context.deferLocalSlotResets &&
		!hasLocalStyleSource(context) &&
		!canInherit &&
		!localSlotExists &&
		!hasInheritedSlot
	);
};

const mergeBucket = (
	resolvedBucket: Record<string, unknown> | undefined,
	source: Record<string, unknown> | undefined,
) => {
	"worklet";

	if (!source) {
		return resolvedBucket;
	}

	let nextBucket = resolvedBucket;

	for (const key in source) {
		const value = source[key];

		if (!hasDefinedBucketValue(value)) {
			continue;
		}

		nextBucket = nextBucket ?? {};
		nextBucket[key] = value;
	}

	return nextBucket;
};

const getMergedLocalSlot = (
	context: ResolveSlotStylesContext,
	slotId: string,
) => {
	"worklet";
	let mergedStyle: Record<string, unknown> | undefined;
	let mergedProps: Record<string, unknown> | undefined;

	for (let index = 0; index < context.localStylesMaps.length; index++) {
		const slot = context.localStylesMaps[index]?.[slotId];

		if (slot === undefined) {
			continue;
		}

		mergedStyle = mergeBucket(
			mergedStyle,
			slot.style as Record<string, unknown> | undefined,
		);
		mergedProps = mergeBucket(mergedProps, slot.props);
	}

	if (!mergedStyle && !mergedProps) {
		return undefined;
	}

	return {
		style: mergedStyle,
		props: mergedProps,
	};
};

const getSlotForId = (context: ResolveSlotStylesContext, slotId: string) => {
	"worklet";

	if (hasLocalSlot(context, slotId)) {
		return getMergedLocalSlot(context, slotId);
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
	const appendedSlotIds: Record<string, true> = {};

	for (let index = 0; index < context.localStylesMaps.length; index++) {
		const stylesMap = context.localStylesMaps[index];

		for (const slotId in stylesMap) {
			if (stylesMap[slotId] === undefined || appendedSlotIds[slotId]) {
				continue;
			}

			appendedSlotIds[slotId] = true;
			appendResolvedSlot(context, slotId);
		}
	}
};

const shouldAppendInheritedSlot = (
	context: ResolveSlotStylesContext,
	slotId: string,
) => {
	"worklet";
	return shouldSlotInherit(slotId) && !hasLocalSlot(context, slotId);
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

	return !hasLocalSlot(context, slotId) && !inheritedSlotExists;
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
	localStylesMaps,
	ancestorStylesMap,
	previousStyleStatesBySlot,
	deferLocalSlotResets = false,
}: {
	localStylesMaps: LocalStyleLayers;
	ancestorStylesMap: NormalizedTransitionInterpolatedStyle;
	previousStyleStatesBySlot: ResettableStyleStatesBySlot;
	deferLocalSlotResets?: boolean;
}) => {
	"worklet";
	const resolvedStylesMap: NormalizedTransitionInterpolatedStyle = {};
	const nextPreviousStyleStatesBySlot: ResettableStyleStatesBySlot = {};
	const context = {
		localStylesMaps,
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
