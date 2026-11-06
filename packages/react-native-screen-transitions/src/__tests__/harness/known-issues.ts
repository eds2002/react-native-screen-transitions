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

const recipeOf = (scenario: string) => transitionOf(scenario).replace("handoff-", "");
const topologyOf = (scenario: string) => scenario.split(" / ")[1];

export const KNOWN_ISSUES: KnownIssue[] = [
	{
		id: "handoff-payload-rides-destination-screen",
		summary:
			"A handoff payload is placed in the receiving boundary's host inside its screen's content layer, so " +
			"it takes that screen's fade: it goes to the destination as the open starts (still transparent) and " +
			"fades in, and on close fades out with it and pops back onto the card. Zoom also scales the " +
			"destination slot uniformly, so on the handover frame the payload changes shape (the card's 168 px " +
			"height to 122) - hidden today by the same fade. A true shared element needs a layer of its own above " +
			"both screens, placed by the pair's geometry.",
		environments: ["teleport"],
		matches: (scenario, v) =>
			scenario.startsWith("handoff-") &&
			(v.rule === "payload-hidden" ||
				(v.scene === "List#payload-card" && ["element-teleport", "element-spike"].includes(v.rule))),
	},
	{
		id: "handoff-zoom-reopen-source-opacity-step",
		summary:
			"Zoom to a bound, re-opened while closing: the source frame's opacity steps from 1 to 0.41 in one frame.",
		environments: ["teleport"],
		matches: (scenario, v) =>
			recipeOf(scenario) === "zoom" &&
			sequenceOf(scenario) === "open-pop-open" &&
			v.scene === "List#bound:card" &&
			v.rule === "element-teleport",
	},
	{
		id: "handoff-cross-stack-returns-to-source",
		summary:
			"A handoff from a card in a nested stack to a screen on the root stack: once the open settles, the " +
			"payload goes back to the card under the open screen (the card's stack can't see the pair).",
		environments: ["teleport"],
		matches: (scenario, v) =>
			scenario.startsWith("handoff-") && topologyOf(scenario) === "cross-stack" && v.rule === "payload-rest",
	},
	{
		id: "handoff-scrolled-destination-dismiss",
		summary:
			"Swipe-dismissing a destination scrolled while open: the payload stays at the destination slot (off " +
			"the top) instead of returning to its card.",
		environments: ["teleport"],
		matches: (scenario, v) =>
			scenario.startsWith("handoff-") &&
			topologyOf(scenario) === "scrolled-destination" &&
			sequenceOf(scenario) === "swipe-dismiss" &&
			v.rule === "payload-rest",
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
			"Shared bounds over a chain (A → B → C → D): pushing each level while the last is still opening, " +
			"then popping back the same way, makes background screens snap (a 52.8 px step: the zoom background " +
			"scale dropping to full size in one frame), part of A vanish in one frame, and the source cards of B " +
			"and C jump between their tracked and rest rects. HARNESS SUSPECT: not reproduced on a device (chain lab, " +
			"fast push / fast pop, frame analyzer clean and nothing visible); likely changes on screens that are " +
			"covered or faded at that moment, which the harness does not occlude.",
		matches: (scenario, v) =>
			scenario.startsWith("bounds-chain-") &&
			scenario.endsWith("/ fast-push-chain-then-fast-pop-chain") &&
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
		id: "zoom-to-bound-scrolled-destination-swipe-landing",
		summary:
			"Shared bounds + scroll: swiping back from a scrolled zoom({ target: 'bound' }) destination lands the " +
			"boundary off the source card (about 48 px off and 30% small). A button pop from the same state lands.",
		matches: (scenario, v) =>
			scenario === "scroll-bounds-zoom-to-bound / zoom-spec / scroll-destination-then-swipe-back" && v.rule === "trajectory",
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
