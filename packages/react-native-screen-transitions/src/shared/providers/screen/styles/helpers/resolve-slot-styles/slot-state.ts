import type { NormalizedTransitionSlotStyle } from "../../../../../types/animation.types";
import { getPropResetValue, getStyleResetValue } from "./reset-values";
import type { ResettableStyleState } from "./types";

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

const hasEitherKeySet = (
	styleKeys: Record<string, true> | undefined,
	propKeys: Record<string, true> | undefined,
	hasClip: boolean,
) => {
	"worklet";
	return styleKeys !== undefined || propKeys !== undefined || hasClip;
};

const getNextStyleState = ({
	styleKeys,
	styleResetValues,
	propKeys,
	propResetValues,
	hasClip,
}: {
	styleKeys: Record<string, true> | undefined;
	styleResetValues: Record<string, unknown> | undefined;
	propKeys: Record<string, true> | undefined;
	propResetValues: Record<string, unknown> | undefined;
	hasClip: boolean;
}): ResettableStyleState | undefined => {
	"worklet";

	if (!hasEitherKeySet(styleKeys, propKeys, hasClip)) {
		return undefined;
	}

	return {
		styleKeys,
		styleResetValues,
		propKeys,
		propResetValues,
		hadClip: hasClip ? true : undefined,
	};
};

export const getResolvedSlotState = (
	slot: NormalizedTransitionSlotStyle | undefined,
) => {
	"worklet";
	const baseStyle = slot?.style as Record<string, unknown> | undefined;
	const baseProps = slot?.props as Record<string, unknown> | undefined;
	const clip = slot?.clip;
	const hasClip = clip !== undefined && clip !== null;

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
		clip,
		hasClip,
		hasAnyKeys: hasAnyStyleKeys || hasAnyPropKeys || hasClip,
		nextState: getNextStyleState({
			styleKeys,
			styleResetValues,
			propKeys,
			propResetValues,
			hasClip,
		}),
	};
};
