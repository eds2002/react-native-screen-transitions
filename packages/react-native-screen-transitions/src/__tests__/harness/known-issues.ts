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
	/** Catalog runs (their labels) the issue shows in; all when omitted. */
	environments?: string[];
};

const sequenceOf = (scenario: string) => scenario.split(" / ")[2];
const transitionOf = (scenario: string) => scenario.split(" / ")[0];


export const KNOWN_ISSUES: KnownIssue[] = [
	{
		id: "boundary-measures-own-motion-without-teleport",
		summary:
			"Without react-native-teleport there is no escape placeholder: the boundary's own root is measured, and it " +
			"carries the boundary's animated style. A source measured again as a close starts (a swipe released while " +
			"styles() still moves the card) includes the card's own motion, so its path starts where the card was drawn, " +
			"and both copies step ~100 px. With teleport the unstyled placeholder is measured. Fix: measure the root's " +
			"layout without its own animated transform (or always measure a placeholder).",
		matches: (scenario, v) =>
			scenario === "bounds-styles / preset-spec / swipe-dismiss" && v.rule === "element-spike",
		environments: ["ios", "android", "compact", "120hz", "custom-navigator"],
	},
	{
		id: "zoom-measured-mid-zoom",
		summary:
			"Found once measure() included animated transforms, as a device does. zoom() composes window-space " +
			"measurements; a boundary measured again while zoom still scales its screen (a pop mid-open, open-pop-open, a " +
			"fast push then a swipe, a scrolled destination swiped back) is measured scaled and off its rest, and the zoom " +
			"lands there (trajectory) or steps (element-spike/teleport). styles() works in layout space (measurements " +
			"undo the screen transform they were taken with); zoom() should too (same root as zoom-settled-background-reset).",
		matches: (scenario, v) =>
			(scenario.startsWith("bounds-zoom-to-bound") ||
				scenario.startsWith("scroll-bounds-zoom-to-bound") ||
				scenario.startsWith("bounds-chain-zoom-to-bound") ||
				scenario.startsWith("bounds-global-")) &&
			["pop-mid-open", "open-pop-open", "open-pop-open-from-scrolled-list", "fast-push-then-swipe", "scroll-destination-then-swipe-back"].includes(
				sequenceOf(scenario),
			) &&
			["trajectory", "element-spike", "element-teleport"].includes(v.rule),
	},
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
		id: "zoom-settled-background-reset",
		summary:
			"Same root as zoom-pinch-background-snap: zoom() resets the covered screen to full size once the screen " +
			"over it settles (so its cards are measured unscaled), and puts the 0.94 background scale back when that " +
			"screen moves again. A full-screen cover hides both steps; dragging back through a chain does not: B is " +
			"still being uncovered by C (not full screen) when it starts its own drag, so A, under it, steps 52 px in " +
			"view (and its boundaries with it). Fix: measure boundaries in rest coordinates (undo the screen's content transform) and drop the reset.",
		matches: (scenario, v) =>
			scenario.startsWith("bounds-chain-zoom") &&
			["drag-chain-quickly", "drag-middle-right-after", "drag-middle-mid-close"].includes(sequenceOf(scenario)) &&
			// The screen's step, and its boundaries stepping with it.
			["spike", "element-spike"].includes(v.rule) &&
			["A", "B"].includes(v.scene?.split("#")[0] ?? ""),
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
		id: "zoom-chain-fast-push-pop-snaps",
		summary:
			"Shared bounds over a chain (A → B → C → D): pushing each level while the last is still opening " +
			"makes background screens snap (a 52.8 px step: the zoom background scale dropping to full size in " +
			"one frame), part of A vanish in one frame, and the source cards of B and C jump between their " +
			"tracked and rest rects (popping back the same way too). The screen steps were not visible on a " +
			"device (covered or faded at that moment). The cards were: a card is measured while its screen " +
			"still zooms in, so its close landed off (fixed: the source is measured again as the close starts); " +
			"see the README follow-up on measure().",
		matches: (scenario, v) =>
			scenario.startsWith("bounds-chain-") &&
			["fast-push-chain-then-fast-pop-chain", "fast-push-then-pop", "fast-push-then-swipe"].includes(
				sequenceOf(scenario),
			) &&
			["spike", "vanish", "element-teleport", "element-spike"].includes(v.rule),
	},
	{
		id: "zoom-chain-pop-during-pop-source-snap",
		summary:
			"Shared bounds, A → B → C → D settled, then pop twice in quick succession: C's source card (tracking " +
			"D's close, at about half opacity and expanded) snaps back to its rest rect in one frame when C is " +
			"popped mid-way through D's close, and B and C step by 45–53 px. HARNESS SUSPECT: not reproduced on a " +
			"device (chain lab, pop twice, frame analyzer clean); likely a snap on a screen already closing out of view.",
		matches: (scenario, v) =>
			scenario.startsWith("bounds-chain-") &&
			scenario.endsWith("/ deep-then-double-pop") &&
			["spike", "element-teleport", "element-spike"].includes(v.rule),
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
		id: "zoom-visible-hard-cut-unverified",
		summary:
			"zoom({ keepFocusedVisible: true }) without a handoff: the landed screen is removed at full opacity in one " +
			"frame. Invisible only if the source card shows in that same frame. Unverified: confirm on a device " +
			"(scrollbounds lab, mode visible).",
		matches: (scenario, v) => scenario.startsWith("scroll-bounds-zoom-visible") && v.rule === "vanish",
	},
	{
		id: "zoom-to-bound-bound-scrolled-away",
		summary:
			"Shared bounds + scroll: with the destination boundary scrolled fully out of view, closing a " +
			"zoom({ target: 'bound' }) collapses the screen into a zero-height sliver at the bottom. HARNESS SUSPECT: " +
			"on a device it shrinks and fades toward the card (scrollbounds lab); find why the harness differs.",
		matches: (scenario, v) =>
			scenario === "scroll-bounds-zoom-to-bound / zoom-spec / destination-bound-scrolled-away-then-close" && v.rule === "trajectory",
	},
];
