import {
	getPendingLink,
	hasSourceLink,
} from "../../../stores/bounds/internals/registry";

export const resolvePendingSourceKey = (
	sharedBoundTag: string,
	expectedSourceScreenKey?: string,
): string | null => {
	"worklet";
	if (
		expectedSourceScreenKey &&
		(getPendingLink(sharedBoundTag, expectedSourceScreenKey) ||
			hasSourceLink(sharedBoundTag, expectedSourceScreenKey))
	) {
		return expectedSourceScreenKey;
	}

	return getPendingLink(sharedBoundTag)?.source.screenKey ?? null;
};
