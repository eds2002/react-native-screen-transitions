import type { NormalizedTransitionSlotStyle } from "../../../../../types/animation.types";
import { getPropResetValue, getStyleResetValue } from "./reset-values";
import type { ResettableStyleState } from "./types";

const isDefinedStyleValue = (value: unknown) => {
	"worklet";
	return value !== undefined && value !== null;
};

/**
 * True when `source` defines exactly the keys in `previousKeys`. Reset values
 * depend only on the key, so the previous key and reset records stay valid.
 */
const hasSameDefinedKeys = (
	source: Record<string, unknown> | undefined,
	previousKeys: Record<string, true> | undefined,
) => {
	"worklet";
	if (!previousKeys) {
		return false;
	}

	let definedCount = 0;
	for (const key in source) {
		if (!isDefinedStyleValue(source[key])) {
			continue;
		}
		if (previousKeys[key] !== true) {
			return false;
		}
		definedCount++;
	}

	let previousCount = 0;
	for (const _key in previousKeys) {
		previousCount++;
	}

	return definedCount === previousCount;
};

// fallow-ignore-next-line complexity
const collectDefinedKeys = ({
	source,
	getResetValue,
	previousKeys,
	previousResetValues,
}: {
	source: Record<string, unknown> | undefined;
	getResetValue: (key: string, value: unknown) => unknown;
	previousKeys?: Record<string, true>;
	previousResetValues?: Record<string, unknown>;
}) => {
	"worklet";
	// Mid-transition an interpolator returns the same keys every frame; reuse
	// last frame's records instead of rebuilding them.
	if (hasSameDefinedKeys(source, previousKeys)) {
		return {
			keys: previousKeys,
			resetValues: previousResetValues,
			hasKeys: true,
		};
	}

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
	previousState,
}: {
	styleKeys: Record<string, true> | undefined;
	styleResetValues: Record<string, unknown> | undefined;
	propKeys: Record<string, true> | undefined;
	propResetValues: Record<string, unknown> | undefined;
	previousState: ResettableStyleState | undefined;
}): ResettableStyleState | undefined => {
	"worklet";

	if (!hasEitherKeySet(styleKeys, propKeys)) {
		return undefined;
	}

	if (
		previousState &&
		previousState.styleKeys === styleKeys &&
		previousState.styleResetValues === styleResetValues &&
		previousState.propKeys === propKeys &&
		previousState.propResetValues === propResetValues
	) {
		return previousState;
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
	previousState?: ResettableStyleState,
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
		previousKeys: previousState?.styleKeys,
		previousResetValues: previousState?.styleResetValues,
	});
	const {
		keys: propKeys,
		resetValues: propResetValues,
		hasKeys: hasAnyPropKeys,
	} = collectDefinedKeys({
		source: baseProps,
		getResetValue: getPropResetValue,
		previousKeys: previousState?.propKeys,
		previousResetValues: previousState?.propResetValues,
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
			previousState,
		}),
	};
};
