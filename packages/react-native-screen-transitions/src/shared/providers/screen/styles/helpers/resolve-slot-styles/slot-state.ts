import type { NormalizedTransitionSlotStyle } from "../../../../../types/animation.types";
import { getPropResetValue, getStyleResetValue } from "./reset-values";
import type { ResettableStyleState } from "./types";

const hasTrackedKey = (keys: Record<string, true> | undefined, key: string) => {
	"worklet";
	return keys !== undefined && keys[key] === true;
};

const isDefinedStyleValue = (value: unknown) => {
	"worklet";
	return value !== undefined && value !== null;
};

// fallow-ignore-next-line complexity
const collectDefinedKeys = ({
	source,
	getResetValue,
}: {
	source: Record<string, unknown> | undefined;
	getResetValue: (key: string, value: unknown) => unknown;
}) => {
	"worklet";
	const sourceValues = source ?? {};
	const keys: Record<string, true> = {};
	const resetValues: Record<string, unknown> = {};
	let hasKeys = false;
	let hasResetValues = false;

	for (const key in sourceValues) {
		const value = sourceValues[key];

		if (!isDefinedStyleValue(value)) {
			continue;
		}

		keys[key] = true;
		hasKeys = true;

		const resetValue = getResetValue(key, value);

		if (resetValue !== undefined) {
			resetValues[key] = resetValue;
			hasResetValues = true;
		}
	}

	return {
		keys: hasKeys ? keys : undefined,
		resetValues: hasResetValues ? resetValues : undefined,
		hasKeys,
	};
};

export const hasDisappearedKeys = (
	previousKeys: Record<string, true> | undefined,
	currentKeys: Record<string, true> | undefined,
) => {
	"worklet";

	if (!previousKeys) {
		return false;
	}

	for (const key in previousKeys) {
		if (!hasTrackedKey(currentKeys, key)) {
			return true;
		}
	}

	return false;
};

const hasEitherKeySet = (
	styleKeys: Record<string, true> | undefined,
	propKeys: Record<string, true> | undefined,
) => {
	"worklet";
	return styleKeys !== undefined || propKeys !== undefined;
};

const getNextStyleState = ({
	styleKeys,
	styleResetValues,
	propKeys,
	propResetValues,
}: {
	styleKeys: Record<string, true> | undefined;
	styleResetValues: Record<string, unknown> | undefined;
	propKeys: Record<string, true> | undefined;
	propResetValues: Record<string, unknown> | undefined;
}): ResettableStyleState | undefined => {
	"worklet";

	if (!hasEitherKeySet(styleKeys, propKeys)) {
		return undefined;
	}

	return {
		styleKeys,
		styleResetValues,
		propKeys,
		propResetValues,
	};
};

export const getResolvedSlotState = (
	slot: NormalizedTransitionSlotStyle | undefined,
) => {
	"worklet";
	const baseStyle = slot?.style as Record<string, unknown> | undefined;
	const baseProps = slot?.props as Record<string, unknown> | undefined;

	const {
		keys: styleKeys,
		resetValues: styleResetValues,
		hasKeys: hasAnyStyleKeys,
	} = collectDefinedKeys({
		source: baseStyle,
		getResetValue: getStyleResetValue,
	});
	const {
		keys: propKeys,
		resetValues: propResetValues,
		hasKeys: hasAnyPropKeys,
	} = collectDefinedKeys({
		source: baseProps,
		getResetValue: getPropResetValue,
	});

	return {
		baseStyle,
		baseProps,
		styleKeys,
		propKeys,
		hasAnyStyleKeys,
		hasAnyPropKeys,
		hasAnyKeys: hasAnyStyleKeys || hasAnyPropKeys,
		nextState: getNextStyleState({
			styleKeys,
			styleResetValues,
			propKeys,
			propResetValues,
		}),
	};
};
