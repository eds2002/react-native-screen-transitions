// @ts-nocheck
/**
 * shared-bounds: a copy of the element on each screen (`Transition.Boundary` with the same id), matched
 * by `bounds(id).styles()` in the interpolator, or by the `bounds(id).navigation.zoom()` recipe built
 * on it. Every case a user hits: chains, spam, scrolling on both screens, and pairs that cross
 * nested navigators N deep, above or below. See boundary-lab.tsx for the options and testids.
 */
import { createBoundaryLab } from "./boundary-lab";
import type { Lab } from "./ui";

export const lab: Lab = {
	id: "shared-bounds",
	title: "Shared bounds",
	covers:
		"Copies matched by bounds().styles() / zoom() / zoom to bound: chains, spam, scroll on both screens, nested trees above and below",
	Component: createBoundaryLab("bounds", "sb"),
};
