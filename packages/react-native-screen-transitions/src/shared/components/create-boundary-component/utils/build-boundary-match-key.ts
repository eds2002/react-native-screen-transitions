import type { BoundaryId } from "../types";

type BuildBoundaryMatchKeyParams = {
	group?: string;
	id: BoundaryId;
};

export function buildBoundaryMatchKey(
	params: BuildBoundaryMatchKeyParams,
): string;
export function buildBoundaryMatchKey(
	group: string | undefined,
	id: BoundaryId,
): string;
export function buildBoundaryMatchKey(
	paramsOrGroup: BuildBoundaryMatchKeyParams | string | undefined,
	legacyId?: BoundaryId,
): string {
	"worklet";

	if (typeof paramsOrGroup === "object" && paramsOrGroup !== null) {
		const { group, id } = paramsOrGroup;
		return group ? `${group}:${id}` : String(id);
	}

	const group = paramsOrGroup;
	const id = legacyId;
	return group ? `${group}:${id}` : String(id);
}
