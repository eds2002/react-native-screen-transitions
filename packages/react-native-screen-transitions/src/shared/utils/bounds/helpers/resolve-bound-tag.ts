import { BoundStore } from "../../../stores/bounds";

export type ResolveBoundTagParams = {
	id?: string;
	group?: string;
};

export const resolveBoundTag = ({
	id,
	group,
}: ResolveBoundTagParams): string | undefined => {
	"worklet";

	if (!id) return id;

	if (!group) {
		return id;
	}

	const currentActiveId = BoundStore.getGroupActiveId(group);
	if (currentActiveId !== id) {
		BoundStore.setGroupActiveId(group, id);
	}

	return `${group}:${id}`;
};
