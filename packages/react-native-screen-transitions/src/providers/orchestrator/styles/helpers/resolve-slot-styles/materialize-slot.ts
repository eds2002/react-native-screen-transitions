import type { NormalizedTransitionSlotStyle } from "../../../../../types/animation.types";
import { PROP_RESET_VALUES, STYLE_RESET_VALUES } from "../../constants";
import type { ResettableStyleState } from "./types";

// fallow-ignore-next-line complexity
const materializeResolvedBucket = ({
	source,
	previousKeys,
	previousResetValues,
	currentKeys,
	hasAnyKeys,
	hasResetPatch,
	resetValues,
	resetKeys,
}: {
	source: Record<string, unknown> | undefined;
	previousKeys: Record<string, true> | undefined;
	previousResetValues: Record<string, unknown> | undefined;
	currentKeys: Record<string, true> | undefined;
	hasAnyKeys: boolean;
	hasResetPatch: boolean;
	resetValues: Record<string, unknown> | undefined;
	/** Filled with the keys this frame resets (see NormalizedTransitionSlotStyle.resetStyleKeys). */
	resetKeys?: Record<string, true>;
}) => {
	"worklet";

	if (!hasAnyKeys && !hasResetPatch) {
		return undefined;
	}

	const resolvedBucket: Record<string, unknown> = {};
	const keysToReset = previousKeys ?? {};

	for (const key in keysToReset) {
		if (currentKeys !== undefined && currentKeys[key] === true) {
			continue;
		}

		const previousResetValue = previousResetValues?.[key];
		const resetValue =
			previousResetValue !== undefined
				? previousResetValue
				: resetValues?.[key];

		if (resetValue !== undefined) {
			resolvedBucket[key] = resetValue;
			if (resetKeys) resetKeys[key] = true;
		}
	}

	if (source) {
		for (const key in source) {
			const value = source[key];

			if (value !== undefined && value !== null) {
				resolvedBucket[key] = value;
			}
		}
	}

	return resolvedBucket;
};

const materializeResolvedStyle = ({
	baseStyle,
	previousState,
	styleKeys,
	hasAnyStyleKeys,
	hasStyleResetPatch,
	resetKeys,
}: {
	baseStyle: Record<string, unknown> | undefined;
	previousState: ResettableStyleState | undefined;
	styleKeys: Record<string, true> | undefined;
	hasAnyStyleKeys: boolean;
	hasStyleResetPatch: boolean;
	resetKeys?: Record<string, true>;
}) => {
	"worklet";
	return materializeResolvedBucket({
		source: baseStyle,
		previousKeys: previousState?.styleKeys,
		previousResetValues: previousState?.styleResetValues,
		currentKeys: styleKeys,
		hasAnyKeys: hasAnyStyleKeys,
		hasResetPatch: hasStyleResetPatch,
		resetValues: STYLE_RESET_VALUES,
		resetKeys,
	});
};

const materializeResolvedProps = ({
	baseProps,
	previousState,
	propKeys,
	hasAnyPropKeys,
	hasPropResetPatch,
}: {
	baseProps: Record<string, unknown> | undefined;
	previousState: ResettableStyleState | undefined;
	propKeys: Record<string, true> | undefined;
	hasAnyPropKeys: boolean;
	hasPropResetPatch: boolean;
}) => {
	"worklet";
	return materializeResolvedBucket({
		source: baseProps,
		previousKeys: previousState?.propKeys,
		previousResetValues: previousState?.propResetValues,
		currentKeys: propKeys,
		hasAnyKeys: hasAnyPropKeys,
		hasResetPatch: hasPropResetPatch,
		resetValues: PROP_RESET_VALUES,
	});
};

export const materializeResolvedSlot = ({
	baseStyle,
	baseProps,
	previousState,
	styleKeys,
	propKeys,
	hasAnyStyleKeys,
	hasAnyPropKeys,
	hasStyleResetPatch,
	hasPropResetPatch,
}: {
	baseStyle: Record<string, unknown> | undefined;
	baseProps: Record<string, unknown> | undefined;
	previousState: ResettableStyleState | undefined;
	styleKeys: Record<string, true> | undefined;
	propKeys: Record<string, true> | undefined;
	hasAnyStyleKeys: boolean;
	hasAnyPropKeys: boolean;
	hasStyleResetPatch: boolean;
	hasPropResetPatch: boolean;
}) => {
	"worklet";
	const resolvedSlot = {} as NormalizedTransitionSlotStyle;

	// Only a frame whose keys changed resets any.
	const resetStyleKeys: Record<string, true> | undefined = hasStyleResetPatch
		? {}
		: undefined;
	const resolvedStyle = materializeResolvedStyle({
		baseStyle,
		previousState,
		styleKeys,
		hasAnyStyleKeys,
		hasStyleResetPatch,
		resetKeys: resetStyleKeys,
	});
	const resolvedProps = materializeResolvedProps({
		baseProps,
		previousState,
		propKeys,
		hasAnyPropKeys,
		hasPropResetPatch,
	});

	resolvedSlot.style = resolvedStyle;
	resolvedSlot.props = resolvedProps;
	if (resetStyleKeys) {
		for (const _key in resetStyleKeys) {
			resolvedSlot.resetStyleKeys = resetStyleKeys;
			break;
		}
	}

	if (!resolvedSlot.style && !resolvedSlot.props) {
		return undefined;
	}

	return resolvedSlot;
};
