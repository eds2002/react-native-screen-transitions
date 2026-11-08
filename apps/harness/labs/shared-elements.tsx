// @ts-nocheck
/**
 * shared-elements: one live view handed between screens (`Transition.Boundary handoff`: the list's
 * card holds the content, every other screen's boundary with the same id receives it), moved by
 * `bounds(id).styles()` in the interpolator. The content ticks and spins, so a remount shows. The same
 * cases as shared-bounds: chains, spam, scrolling on both screens, nested trees above and below.
 */
import { createBoundaryLab } from "./boundary-lab";
import type { Lab } from "./ui";

export const lab: Lab = {
	id: "shared-elements",
	title: "Shared elements",
	covers:
		"One live view (handoff) moved by bounds().styles(): chains, spam, scroll on both screens, nested trees above and below",
	Component: createBoundaryLab("elements", "se"),
};
