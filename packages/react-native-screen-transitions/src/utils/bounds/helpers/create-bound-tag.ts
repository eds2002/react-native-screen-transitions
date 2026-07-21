import type {
	BoundId,
	BoundsIdentity,
	BoundsIdentityInput,
} from "../types/options";

type CreateBoundTagParams = {
	id?: BoundId;
	group?: string;
};

const splitBoundTag = (id: BoundId): BoundsIdentity => {
	"worklet";

	const normalizedId = String(id);
	const separatorIndex = normalizedId.indexOf(":");

	if (separatorIndex <= 0 || separatorIndex >= normalizedId.length - 1) {
		return { id };
	}

	return {
		group: normalizedId.slice(0, separatorIndex),
		id: normalizedId.slice(separatorIndex + 1),
	};
};

export const normalizeBoundIdentity = (
	identity: BoundsIdentityInput,
	fallbackGroup?: string,
): BoundsIdentity => {
	"worklet";

	const source =
		typeof identity === "object"
			? identity
			: ({
					id: identity,
				} satisfies BoundsIdentity);
	const parsed = splitBoundTag(source.id);
	const group = source.group || parsed.group || fallbackGroup;

	return {
		id: parsed.id,
		group,
	};
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

	const identity = normalizeBoundIdentity({ id, group });
	const normalizedId = String(identity.id);

	if (!identity.group) {
		return normalizedId;
	}

	return `${identity.group}:${normalizedId}`;
};
