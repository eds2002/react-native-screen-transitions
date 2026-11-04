import type { ResettableStyleStatesBySlot } from "./types";

const areRecordsEqual = (
	left: Record<string, unknown> | undefined,
	right: Record<string, unknown> | undefined,
) => {
	"worklet";
	if (left === right) {
		return true;
	}

	if (!left || !right) {
		return false;
	}

	for (const key in left) {
		if (left[key] !== right[key]) {
			return false;
		}
	}

	for (const key in right) {
		if (!(key in left)) {
			return false;
		}
	}

	return true;
};

const areResettableStatesEqual = (
	left: ResettableStyleStatesBySlot[string] | undefined,
	right: ResettableStyleStatesBySlot[string] | undefined,
) => {
	"worklet";
	if (left === right) {
		return true;
	}

	if (!left || !right) {
		return false;
	}

	return (
		areRecordsEqual(left.styleKeys, right.styleKeys) &&
		areRecordsEqual(left.styleResetValues, right.styleResetValues) &&
		areRecordsEqual(left.propKeys, right.propKeys) &&
		areRecordsEqual(left.propResetValues, right.propResetValues)
	);
};

export const areResettableStatesBySlotEqual = (
	left: ResettableStyleStatesBySlot,
	right: ResettableStyleStatesBySlot,
) => {
	"worklet";
	if (left === right) {
		return true;
	}

	for (const slotId in left) {
		if (!areResettableStatesEqual(left[slotId], right[slotId])) {
			return false;
		}
	}

	for (const slotId in right) {
		if (!(slotId in left)) {
			return false;
		}
	}

	return true;
};
