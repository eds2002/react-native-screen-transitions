import { PROP_RESET_VALUES, STYLE_RESET_VALUES } from "../../constants";

export const getStyleResetValue = (key: string, value: unknown) => {
	"worklet";
	const explicitResetValue = STYLE_RESET_VALUES[key];

	if (explicitResetValue !== undefined) {
		return explicitResetValue;
	}

	if (typeof value === "number") {
		return 0;
	}

	return undefined;
};

export const getPropResetValue = (key: string, value: unknown) => {
	"worklet";
	const explicitResetValue = PROP_RESET_VALUES[key];

	if (explicitResetValue !== undefined) {
		return explicitResetValue;
	}

	if (typeof value === "number") {
		return 0;
	}

	return undefined;
};
