/**
 * Library behavior the harness has found and that is not fixed yet. Each entry
 * explains a group of violations; the catalog test fails on any violation no
 * entry explains, and on an entry that no longer matches anything (fixed:
 * delete it). Inspect one with `SCENARIO="<name>" bun test inspect`.
 */
import type { Violation } from "./invariants";

export type KnownIssue = {
	id: string;
	summary: string;
	matches: (scenario: string, violation: Violation) => boolean;
};

const sequenceOf = (scenario: string) => scenario.split(" / ")[2];
const transitionOf = (scenario: string) => scenario.split(" / ")[0];

export const KNOWN_ISSUES: KnownIssue[] = [
	{
		id: "interrupted-navigation",
		summary:
			"A push landing during another push still steps the screens: the first screen's progress is " +
			"driven below 0, so it jumps off-screen and flies back in (rapid, rapid-push-pop). A push during a " +
			"pop is continuous: the closing screen stays and finishes, and the screen underneath follows " +
			"whichever of the two covers it more.",
		matches: (scenario, v) =>
			["rapid", "rapid-push-pop"].includes(sequenceOf(scenario)) &&
			["vanish", "spike", "teleport", "flash", "turns-back"].includes(v.rule),
	},
	{
		id: "zoom-pinch-background-snap",
		summary:
			"Pinch-dismissing a zoom: while pinching, the screen underneath stays at full size; on release it snaps to " +
			"its zoom background scale (0.94, a 52 px step) in one frame, then animates back. A swipe dismiss scales " +
			"it continuously.",
		matches: (scenario, v) =>
			scenario.startsWith("bounds-zoom") && scenario.endsWith("/ pinch-dismiss") && v.rule === "spike" && v.scene === "A",
	},
	{
		id: "reveal-dismiss-source-jump",
		summary:
			"(reveal() is deprecated in favour of zoom(); not planned to fix.) "+
			"After swiping away a reveal, the source boundary on the screen underneath stays 29 px off its layout " +
			"position through the close and snaps back when the revealed screen is removed. (Its release also turns " +
			"back by 1-2 px.)",
		matches: (scenario, v) =>
			scenario.startsWith("bounds-reveal") && ["element-spike", "turns-back"].includes(v.rule),
	},
	{
		id: "reveal-opacity-overflow",
		summary:
			"(reveal() is deprecated in favour of zoom(); not planned to fix.) "+
			"navigation.reveal() gives the revealed screen's content an unclamped opacity (up to 1.37, and about 4 " +
			"near the end of opening). React Native clamps it, so nothing visible; it points at an unclamped interpolation.",
		matches: (scenario, v) => scenario.startsWith("bounds-reveal") && v.rule === "style-range",
	},
	{
		id: "zoom-stale-source-after-list-moved",
		summary:
			"Shared bounds + scroll: zoom() closes onto the source card's rect from when it opened. If the list " +
			"under the zoomed screen moved meanwhile (scrolled, rows inserted, offset restored), the screen lands " +
			"where the card used to be. (zoom({ target: 'bound' }) re-measures the source and lands correctly.)",
		matches: (scenario, v) => scenario === "scroll-bounds-zoom / zoom-spec / list-moved-while-covered-then-close" && v.rule === "trajectory",
	},
	{
		id: "zoom-to-bound-scrolled-destination-jump",
		summary:
			"Shared bounds + scroll: after the destination is scrolled, closing a zoom({ target: 'bound' }) makes the " +
			"destination boundary jump by the scroll distance in one frame as the close starts (the boundary is " +
			"placed from its open-time rect, then re-measured where it scrolled to).",
		matches: (scenario, v) =>
			scenario.startsWith("scroll-bounds-zoom-to-bound / zoom-spec / scroll-destination-then-") && v.rule === "element-spike",
	},
	{
		id: "zoom-to-bound-scrolled-destination-swipe-landing",
		summary:
			"Shared bounds + scroll: swiping back from a scrolled zoom({ target: 'bound' }) destination lands the " +
			"boundary off the source card (about 48 px off and 30% small). A button pop from the same state lands.",
		matches: (scenario, v) =>
			scenario === "scroll-bounds-zoom-to-bound / zoom-spec / scroll-destination-then-swipe-back" && v.rule === "trajectory",
	},
	{
		id: "zoom-to-bound-bound-scrolled-away",
		summary:
			"Shared bounds + scroll: with the destination boundary scrolled fully out of view, closing a " +
			"zoom({ target: 'bound' }) collapses the screen into a zero-height sliver at the bottom. No rule for it yet; " +
			"the scenario expects the plain-zoom fallback (the screen shrinks into the card).",
		matches: (scenario, v) =>
			scenario === "scroll-bounds-zoom-to-bound / zoom-spec / destination-bound-scrolled-away-then-close" && v.rule === "trajectory",
	},
];
