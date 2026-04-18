import { BoundStore } from "../../../stores/bounds";

export const resolvePendingSourceKey = (
	sharedBoundTag: string,
	expectedSourceScreenKey?: string,
): string | null => {
	"worklet";
	if (
		expectedSourceScreenKey &&
		(BoundStore.link.getPending(sharedBoundTag, expectedSourceScreenKey) ||
			BoundStore.link.hasSource(sharedBoundTag, expectedSourceScreenKey))
	) {
		return expectedSourceScreenKey;
	}

	return BoundStore.link.getPending(sharedBoundTag)?.source.screenKey ?? null;
};
