import { makeMutable } from "react-native-reanimated";

export const BOUNDARY_GROUP = "bounds-basic";

export type BoundaryItem = {
	id: string;
	color: string;
	label: string;
};

export const ITEMS: BoundaryItem[] = [
	{ id: "a", color: "#4f7cff", label: "A" },
	{ id: "b", color: "#ff6b35", label: "B" },
];

/**
 * Module-level mutable shared value that tracks the currently-active boundary id.
 * Written by the detail screen's scroll handler, read by the layout interpolator.
 * The interpolator passes this to bounds({ group, id }) which triggers
 * the group active tracking + boundary re-measurement chain.
 */
export const activeBoundaryId = makeMutable(ITEMS[0].id);
