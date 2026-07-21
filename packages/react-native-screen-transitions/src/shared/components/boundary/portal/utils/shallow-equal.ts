/**
 * Shallow equality for the flat signal objects produced by the portal
 * `useAnimatedReaction` blocks. Both sides always carry the same fixed key set,
 * so iterating one side's keys is sufficient. A `null`/`undefined` operand
 * (the first reaction run) is treated as not-equal so the reaction proceeds.
 */
export const shallowEqual = (
	a: Record<string, unknown> | null | undefined,
	b: Record<string, unknown> | null | undefined,
) => {
	"worklet";
	if (!a || !b) {
		return false;
	}

	const keys = Object.keys(a);
	for (let index = 0; index < keys.length; index++) {
		const key = keys[index];
		if (a[key] !== b[key]) {
			return false;
		}
	}

	return true;
};
