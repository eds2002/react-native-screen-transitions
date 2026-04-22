export const stripInterpolatorConfig = (raw: Record<string, any>) => {
	"worklet";

	if (!("config" in raw)) {
		return raw;
	}

	const slots: Record<string, any> = {};

	for (const key in raw) {
		if (key !== "config") {
			slots[key] = raw[key];
		}
	}

	return slots;
};
