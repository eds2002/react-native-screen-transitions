import { BoundStore } from "../../../stores/bounds";
import type { BoundId } from "../types/options";

export type ResolveBoundTagParams = {
	id?: BoundId;
	group?: string;
};

export const resolveBoundTag = ({
	id,
	group,
}: ResolveBoundTagParams): string | undefined => {
	"worklet";

	if (id === undefined || id === null || id === "") return undefined;

	const normalizedId = String(id);

	if (!group) {
		return normalizedId;
	}

	const currentActiveId = BoundStore.getGroupActiveId(group);
	if (currentActiveId !== normalizedId) {
		BoundStore.setGroupActiveId(group, normalizedId);
	}

	return `${group}:${normalizedId}`;
};
