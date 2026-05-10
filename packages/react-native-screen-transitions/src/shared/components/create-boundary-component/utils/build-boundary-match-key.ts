import type { BoundaryId } from "../types";

type BuildBoundaryMatchKeyParams = {
	group?: string;
	id: BoundaryId;
};

export function buildBoundaryMatchKey(
	params: BuildBoundaryMatchKeyParams,
): string {
	"worklet";
	const { group, id } = params;
	return group ? `${group}:${id}` : String(id);
}
