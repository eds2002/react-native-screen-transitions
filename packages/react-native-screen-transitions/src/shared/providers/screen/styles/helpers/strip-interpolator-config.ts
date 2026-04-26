const isRuntimeInterpolatorConfig = (value: unknown): boolean => {
	"worklet";

	return (
		typeof value === "object" &&
		value !== null &&
		!("style" in value) &&
		!("props" in value) &&
		"gestureSensitivity" in value
	);
};

export const stripInterpolatorConfig = (raw: Record<string, any>) => {
	"worklet";

	if (!isRuntimeInterpolatorConfig(raw.config)) {
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
