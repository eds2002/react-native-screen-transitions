import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../../../../../types/animation.types";
import { isReservedStyleSlot, shouldSlotInherit } from "../../constants";
import { materializeResolvedSlot } from "./materialize-slot";
import { getResolvedSlotState } from "./slot-state";
import type {
	LocalStyleLayers,
	ResettableStyleState,
	ResettableStyleStatesBySlot,
} from "./types";

export { areResettableStatesBySlotEqual } from "./are-resettable-states-equal";
export type { LocalStyleLayers, ResettableStyleStatesBySlot } from "./types";

type ResolveSlotStylesContext = {
	localStylesMaps: LocalStyleLayers;
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

const hasDefinedBucketValue = (value: unknown) => {
	"worklet";
	return value !== undefined && value !== null;
};

const hasEitherResetPatch = (
	hasStyleResetPatch: boolean,
	hasPropResetPatch: boolean,
) => {
	"worklet";
	return hasStyleResetPatch || hasPropResetPatch;
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

const mergeStateRecord = <Value>(
	previous: Record<string, Value> | undefined,
	current: Record<string, Value> | undefined,
): Record<string, Value> | undefined => {
	"worklet";

	if (!previous) {
		return current;
	}

	if (!current) {
		return previous;
	}

	return {
		...previous,
		...current,
	};
};

const mergeResettableStyleStates = (
	previousState: ResettableStyleState | undefined,
	currentState: ResettableStyleState | undefined,
): ResettableStyleState | undefined => {
	"worklet";

	if (!previousState) {
		return currentState;
	}

	if (!currentState) {
		return previousState;
	}

	return {
		styleKeys: mergeStateRecord(
			previousState.styleKeys,
			currentState.styleKeys,
		),
		styleResetValues: mergeStateRecord(
			previousState.styleResetValues,
			currentState.styleResetValues,
		),
		propKeys: mergeStateRecord(previousState.propKeys, currentState.propKeys),
		propResetValues: mergeStateRecord(
			previousState.propResetValues,
			currentState.propResetValues,
		),
	};
};

const getResolvedSlotOutput = ({
	slot,
	previousState,
	deferMissingKeyResets,
}: {
	slot: NormalizedTransitionSlotStyle | undefined;
	previousState: ResettableStyleState | undefined;
	deferMissingKeyResets: boolean;
}) => {
	"worklet";
	const state = getResolvedSlotState(slot);

	if (deferMissingKeyResets) {
		// This used to force a reset when animationProgress reached zero during
		// close. Zero is still drawable while ownership and native visibility
		// settle, so it is not a safe cleanup boundary for reserved slots.
		return {
			resolvedSlot: getForwardedSlot(slot, state.hasAnyKeys),
			nextState: mergeResettableStyleStates(previousState, state.nextState),
		};
	}

	const hasStyleResetPatch = hasResettableDisappearedKeys(
		previousState?.styleKeys,
		previousState?.styleResetValues,
		state.styleKeys,
	);
	const hasPropResetPatch = hasResettableDisappearedKeys(
		previousState?.propKeys,
		previousState?.propResetValues,
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
			boundsLocalTransform: slot?.boundsLocalTransform,
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

const hasLocalSlot = (context: ResolveSlotStylesContext, slotId: string) => {
	"worklet";

	for (let index = 0; index < context.localStylesMaps.length; index++) {
		if (context.localStylesMaps[index]?.[slotId] !== undefined) {
			return true;
		}
	}

	return false;
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
	let boundsLocalTransform:
		| NormalizedTransitionSlotStyle["boundsLocalTransform"]
		| undefined;

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
		if (slot.boundsLocalTransform?.length) {
			boundsLocalTransform = slot.boundsLocalTransform;
		}
	}

	if (!mergedStyle && !mergedProps && !boundsLocalTransform) {
		return undefined;
	}

	return {
		style: mergedStyle,
		props: mergedProps,
		boundsLocalTransform,
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
		areFlatObjectsEqual(left.props, right.props) &&
		areTransformArraysEqual(
			left.boundsLocalTransform,
			right.boundsLocalTransform,
		)
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
	const { resolvedSlot, nextState } = getResolvedSlotOutput({
		slot: getSlotForId(context, slotId),
		previousState: context.previousStyleStatesBySlot[slotId],
		deferMissingKeyResets: isReservedStyleSlot(slotId),
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
 * Resolves slot styles for the current screen pass.
 *
 * Custom slots reset omitted keys immediately. Reserved screen slots retain
 * omitted keys because lifecycle progress does not define a safe visual reset
 * boundary.
 */
export const resolveSlotStyles = ({
	localStylesMaps,
	ancestorStylesMap,
	previousStyleStatesBySlot,
}: {
	localStylesMaps: LocalStyleLayers;
	ancestorStylesMap: NormalizedTransitionInterpolatedStyle;
	previousStyleStatesBySlot: ResettableStyleStatesBySlot;
}) => {
	"worklet";
	const resolvedStylesMap: NormalizedTransitionInterpolatedStyle = {};
	const nextPreviousStyleStatesBySlot: ResettableStyleStatesBySlot = {};
	const context = {
		localStylesMaps,
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
