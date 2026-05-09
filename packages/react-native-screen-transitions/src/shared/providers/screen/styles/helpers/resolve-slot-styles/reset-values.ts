import { PROP_RESET_VALUES, STYLE_RESET_VALUES } from "../../constants";

export const getStyleResetValue = (key: string, _value: unknown) => {
	"worklet";
	const explicitResetValue = STYLE_RESET_VALUES[key];

	if (explicitResetValue !== undefined) {
		return explicitResetValue;
	}

	return undefined;
};

export const getPropResetValue = (key: string, _value: unknown) => {
	"worklet";
	const explicitResetValue = PROP_RESET_VALUES[key];

	if (explicitResetValue !== undefined) {
		return explicitResetValue;
	}

	return undefined;
};
