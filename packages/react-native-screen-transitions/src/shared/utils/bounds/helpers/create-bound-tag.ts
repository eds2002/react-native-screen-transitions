import type { BoundId } from "../types/options";

export type CreateBoundTagParams = {
	id?: BoundId;
	group?: string;
};

/**
 * Creates a bound tag by formatting the given id and optional group
 * into a `group:id` string. If no group is provided, returns just the id.
 */
export const createBoundTag = ({
	id,
	group,
}: CreateBoundTagParams): string | undefined => {
	"worklet";

	if (id == null || id === "") return undefined;

	const normalizedId = String(id);

	if (!group) {
		return normalizedId;
	}

	return `${group}:${normalizedId}`;
};
