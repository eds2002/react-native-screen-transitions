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
		id: "moving-bounds-overlap",
		summary:
			"styles() on screens that move, when transitions overlap (spam, a chain pushed or popped quickly). " +
			"Left after placing in-flight starts with this frame's transforms and measuring moving roots from their " +
			"last rest: (1) the frame a new screen takes the card while an older one still closes, its copy and the " +
			"source's disagree for 1-2 frames (up to ~60 px); (2) popping two levels quickly, the top screen's copy " +
			"closes toward where the middle one's card is in flight while the source's copy shows that card directly: " +
			"~15 px apart, meeting within ~8 frames; (3) one frame as the second pop starts, where the middle screen " +
			"itself steps (fixed: a closing screen keeps the one still closing above it as its next); (4) without Teleport only (copies render inline): dragging the middle " +
			"screen back right after the top one was swiped away, its copy and the source's disagree for ~39 frames " +
			"(found once the harness swipe started on the screen under the finger, not the one leaving).",
		matches: (scenario, v) =>
			/^bounds-moving-(slide|slide-scale|slide-up) \//.test(scenario) &&
			["spam", "chain-fast", "push-pop-push", "swipe-chain-quickly", "chain"].includes(sequenceOf(scenario)) &&
			["bound-split", "bound-vanish", "element-spike", "element-teleport", "element-flash", "spike"].includes(v.rule),
	},
	{
		id: "moving-bounds-handoff",
		environments: ["teleport"],
		summary:
			"Handoff on screens that move is clean (teleport run; without Teleport handoff renders inline by design). " +
			"What is left is not the payload: as the second pop of a fast chain starts, the middle screen itself steps " +
			"one frame (35 px), the same step as moving-bounds-overlap (3) without handoff.",
		matches: (scenario, v) =>
			/^bounds-moving-[a-z-]+-handoff \//.test(scenario) && sequenceOf(scenario) === "chain-fast" && v.rule === "spike",
	},


	{
		id: "deep-translucent-stack",
		summary:
			"Deep chains whose covered screens stay translucent (slide-fade leaves the screen below at 40%): the screen two " +
			"below the top shows through, and once it is no longer in the moving pair its copy stops being styled and " +
			"draws at its own slot (a second card), stepping back as it leaves the pair.",
		environments: ["ios", "android", "120hz"],
		matches: (scenario, v) =>
			/^bounds-deep-slide-fade \//.test(scenario) &&
			["bound-split", "bound-vanish", "element-spike", "element-teleport", "element-flash", "spike", "teleport"].includes(v.rule),
	},
	{
		id: "deep-handoff-fading-screen",
		summary:
			"Handoff through screens that fade (zoom-in, mixed): the live payload lives in its receiving screen's layer, so " +
			"it fades with that screen: it all but vanishes as a fading screen opens (6 frames) and is invisible for a " +
			"whole close (36 frames) before it lands home. Same root as handoff-payload-rides-destination-screen; the " +
			"fix is the shared-element layer above the screens.",
		environments: ["teleport-deep"],
		matches: (scenario, v) =>
			/^bounds-deep-(zoom-in|mixed|fade|slide-fade)-handoff \//.test(scenario) &&
			["payload-hidden", "element-teleport", "element-flash", "element-spike", "payload-rest"].includes(v.rule),
	},
	{
		id: "deep-swipe-without-teleport",
		summary:
			"Without Teleport (copies inline): swiping back through a chain, each screen right after the one above " +
			"released, the copies disagree for ~100 frames (the same as moving-bounds-overlap (4), over more screens).",
		environments: ["ios", "android", "120hz"],
		matches: (scenario, v) =>
			/^bounds-deep-/.test(scenario) &&
			["swipe-back-through-chain", "swipe-while-opening"].includes(sequenceOf(scenario)) &&
			["bound-split", "bound-vanish", "element-spike", "element-teleport", "element-flash", "spike", "teleport"].includes(v.rule),
	},
	{
		id: "deep-chain-overlap",
		summary:
			"Found by the deep-chain stress family (five screens, many screen motions): transitions overlapping in a deep " +
			"chain (pushes or pops 2-6 frames apart, pop to the root at once, churn, spam). Open: a screen pushed and popped " +
			"again before it settles closes with every copy hidden for a few frames (device: the card leaves with the " +
			"closing screen, then appears on the slot below); copies split for 1-3 frames as a newer pair takes the card; " +
			"the card steps at the handover. (The middle screen's one-frame step as a second pop starts, and the " +
			"copies it dropped with it, are fixed.)",
		matches: (scenario, v) =>
			/^bounds-deep-/.test(scenario) &&
			["chain-5-fast", "chain-5-faster", "pop-to-root-at-once", "churn", "spam", "swipe-cancel-then-pop-fast", "swipe-back-through-chain", "swipe-while-opening"].includes(
				sequenceOf(scenario),
			) &&
			["bound-split", "bound-vanish", "element-spike", "element-teleport", "element-flash", "spike", "teleport", "payload-hidden", "payload-rest"].includes(v.rule),
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
