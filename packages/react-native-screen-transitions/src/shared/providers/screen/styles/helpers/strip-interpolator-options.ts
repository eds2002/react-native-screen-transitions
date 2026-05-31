export const stripInterpolatorOptions = (raw: Record<string, any>) => {
	"worklet";

	if (!("options" in raw)) {
		return raw;
	}

	const slots: Record<string, any> = {};

	for (const key in raw) {
		if (key !== "options") {
			slots[key] = raw[key];
		}
	}

	return slots;
};
