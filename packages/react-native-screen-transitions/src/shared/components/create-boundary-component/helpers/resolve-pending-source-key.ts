import { BoundStore } from "../../../stores/bounds";

export const resolvePendingSourceKey = (
	sharedBoundTag: string,
	expectedSourceScreenKey?: string,
): string | null => {
	"worklet";
	if (
		expectedSourceScreenKey &&
		(BoundStore.hasPendingLinkFromSource(
			sharedBoundTag,
			expectedSourceScreenKey,
		) ||
			BoundStore.hasSourceLink(sharedBoundTag, expectedSourceScreenKey))
	) {
		return expectedSourceScreenKey;
	}

	return BoundStore.getLatestPendingSourceScreenKey(sharedBoundTag);
};
