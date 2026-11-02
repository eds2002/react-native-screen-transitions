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
			"A navigation action during another transition breaks continuity: a push during a pop removes the closing " +
			"screen mid-close and snaps the screen beneath to rest; a pop during a pop removes the closing screen at once; " +
			"a push during a push drives the first screen's progress below 0, so it jumps off-screen and flies back in.",
		matches: (scenario, v) =>
			["push-mid-pop", "rapid"].includes(sequenceOf(scenario)) &&
			["vanish", "spike", "teleport", "flash", "turns-back"].includes(v.rule),
	},
	{
		id: "regrab-during-spring-back",
		summary:
			"Grabbing a screen while it springs back from a cancelled swipe shows its resting pose for one frame, then " +
			"tracks the finger from rest instead of from where it was (startPanBase clears the gesture values the " +
			"spring-back was still animating without folding them into the baseline).",
		matches: (scenario, v) => sequenceOf(scenario) === "regrab-spring-back" && v.rule === "flash",
	},
	{
		id: "release-after-grab-during-snap",
		summary:
			"A sheet grabbed while a snap animation runs (snapTo, or a backdrop collapse) follows the finger, but on " +
			"release it jumps (268 px on a bottom sheet, 124 px on a side sheet) in one frame before its release " +
			"animation runs. Every sheet variant and spec.",
		matches: (scenario, v) =>
			["swipe-during-snap", "tap-backdrop-then-swipe"].includes(sequenceOf(scenario)) && v.rule === "spike",
	},
	{
		id: "screens-under-translucent-screen",
		summary:
			"With a transition that leaves the covered screen translucent (scale-fade fades it to 0.6), screens further " +
			"down show through it, and disappear in one frame when they are deactivated (deep stack) or removed (replace).",
		matches: (scenario, v) =>
			transitionOf(scenario) === "scale-fade" && ["deep", "replace"].includes(sequenceOf(scenario)) && v.rule === "vanish",
	},
];
