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
			"A navigation action during another transition still steps the screens once: the screens below " +
			"switch from following the transition in flight to following the new one (a push during a pop " +
			"shifts the screen underneath ~40 pt in one frame; a push during a push drives the first screen's " +
			"progress below 0). A screen closing when the action lands now stays mounted and finishes its close.",
		matches: (scenario, v) =>
			["push-mid-pop", "rapid", "rapid-push-pop"].includes(sequenceOf(scenario)) &&
			["vanish", "spike", "teleport", "flash", "turns-back"].includes(v.rule),
	},
	{
		id: "nested-sheet-dismiss-crash",
		summary:
			"Dismissing a sheet or drawer inside a nested stack by gesture throws in BlankSceneRow " +
			"(scenesByKey[routeKey] is undefined: the row renders from a store state whose routeKeys still list the " +
			"removed route) and the whole tree unmounts. Seen under react-test-renderer; confirm on a device.",
		matches: (scenario) =>
			[
				"ownership-snap-shadows-axis / preset-spec / swipe-down",
				"ownership-snap-different-axis / preset-spec / swipe-right",
			].includes(scenario),
	},
	{
		id: "locked-sheet-follows-drag",
		summary:
			"A snap-locked sheet with gestures disabled and a 0 snap point (e2e gestures/snap-locked-no-bubble) " +
			"follows a downward drag towards the 0 snap point, then jumps back to its snap point in one frame on " +
			"release. Its GestureInfo table expects no movement (the parent is correctly not dismissed).",
		matches: (scenario, v) =>
			scenario === "ownership-snap-locked-no-bubble / preset-spec / swipe-down" && ["teleport", "spike", "flash"].includes(v.rule),
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
			"After swiping away a reveal, the source boundary on the screen underneath stays 29 px off its layout " +
			"position through the close and snaps back when the revealed screen is removed. (Its release also turns " +
			"back by 1-2 px.)",
		matches: (scenario, v) =>
			scenario.startsWith("bounds-reveal") && ["element-spike", "turns-back"].includes(v.rule),
	},
	{
		id: "reveal-opacity-overflow",
		summary:
			"navigation.reveal() gives the revealed screen's content an unclamped opacity (up to 1.37, and about 4 " +
			"near the end of opening). React Native clamps it, so nothing visible; it points at an unclamped interpolation.",
		matches: (scenario, v) => scenario.startsWith("bounds-reveal") && v.rule === "style-range",
	},
	{
		id: "zoom-to-bound-close-unverified",
		summary:
			"zoom({ target: 'bound' }): on close the destination boundary stays at its own rect until the screen is " +
			"removed instead of shrinking back to the source. Unverified: may be the harness's measure() or inset " +
			"handling (zoom mixes window and safe-area coordinates); confirm on a device.",
		matches: (scenario, v) => scenario === "bounds-zoom-to-bound / zoom-spec / open-close" && v.rule === "trajectory",
	},
];
