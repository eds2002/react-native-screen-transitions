export const findLatestIndex = <T>(
	items: readonly T[],
	matches: (item: T) => boolean,
): number => {
	"worklet";
	for (let i = items.length - 1; i >= 0; i--) {
		if (matches(items[i])) {
			return i;
		}
	}

	return -1;
};

export const findLatest = <T>(
	items: readonly T[],
	matches: (item: T) => boolean,
): T | null => {
	"worklet";
	const index = findLatestIndex(items, matches);
	return index === -1 ? null : (items[index] ?? null);
};
