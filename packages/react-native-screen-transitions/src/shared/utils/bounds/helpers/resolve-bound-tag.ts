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

	return `${group}:${normalizedId}`;
};
