export const areDescriptorsEqual = <
	DescriptorMap extends Record<string, unknown>,
>(
	a: DescriptorMap,
	b: DescriptorMap,
): boolean => {
	if (a === b) return true;

	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);

	if (aKeys.length !== bKeys.length) return false;

	return aKeys.every((key) => a[key] === b[key]);
};

export const setsAreEqual = <T>(
	left: ReadonlySet<T>,
	right: ReadonlySet<T>,
) => {
	if (left.size !== right.size) {
		return false;
	}

	for (const value of left) {
		if (!right.has(value)) {
			return false;
		}
	}

	return true;
};
