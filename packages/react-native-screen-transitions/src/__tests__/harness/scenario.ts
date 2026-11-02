/**
 * Scenarios as data: screens, their options, and steps. `runScenario` mounts
 * the real stack, plays the steps frame by frame and checks every invariant on
 * the trace.
 */
import { WINDOW } from "./install";
import {
	checkContinuity,
	checkFinite,
	checkMonotonic,
	checkSettled,
	checkStartLatency,
	checkVanish,
	type Expectations,
	rectOff,
	type Violation,
} from "./invariants";
import type { ReanimatedSim } from "./reanimated-sim";
import { mountStack, type ScreenSpec, type StackHarness, type TraceFrame } from "./stack-harness";

export type SwipeDirection = "horizontal" | "horizontal-inverted" | "vertical" | "vertical-inverted";

export type Step =
	| { op: "push"; name: string }
	| { op: "navigate"; name: string }
	| { op: "pop" }
	| { op: "replace"; name: string }
	| { op: "settle" }
	| { op: "frames"; count: number }
	| {
			op: "swipe";
			direction: SwipeDirection;
			/** Fraction of the window along the swipe axis. */
			distance: number;
			durationMs: number;
			holdMs?: number;
	  }
	| { op: "pinch"; fromSpan: number; toSpan: number; durationMs: number }
	/** The library's `snapTo(index)` on the focused screen. */
	| { op: "snapTo"; index: number }
	/** Settles, then checks the top screen rests at `expect.snapRects[index]`. */
	| { op: "expectSnap"; index: number };

export type Scenario = {
	name: string;
	screens: ScreenSpec[];
	screenOptions?: Record<string, unknown>;
	steps: Step[];
	expect?: Expectations;
};

export type ScenarioResult = {
	scenario: Scenario;
	trace: TraceFrame[];
	routes: Array<{ key: string; name: string }>;
	violations: Violation[];
};

/** Where a dismiss swipe in `direction` starts and ends. */
export const swipePath = (
	direction: SwipeDirection,
	distance: number,
	within: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, ...WINDOW },
) => {
	const left = Math.max(0, within.x);
	const top = Math.max(0, within.y);
	const right = Math.min(WINDOW.width, within.x + within.width);
	const bottom = Math.min(WINDOW.height, within.y + within.height);
	const cx = (left + right) / 2;
	const cy = (top + bottom) / 2;
	switch (direction) {
		case "horizontal":
			return { from: { x: left + 30, y: cy }, to: { x: left + 30 + distance * WINDOW.width, y: cy } };
		case "horizontal-inverted":
			return { from: { x: right - 30, y: cy }, to: { x: right - 30 - distance * WINDOW.width, y: cy } };
		case "vertical":
			return { from: { x: cx, y: top + 150 }, to: { x: cx, y: top + 150 + distance * WINDOW.height } };
		case "vertical-inverted":
			return { from: { x: cx, y: bottom - 150 }, to: { x: cx, y: bottom - 150 - distance * WINDOW.height } };
	}
};

const { snapTo } = await import("../../controls/snap-to");

const runStep = async (stack: StackHarness, step: Step, expectations: Expectations, violations: Violation[]) => {
	switch (step.op) {
		case "snapTo":
			return stack.js(() => snapTo(step.index));
		case "expectSnap": {
			await stack.settle();
			const top = stack.trace.at(-1)?.scenes.at(-1);
			const want = expectations.snapRects?.[step.index];
			if (!top || !want) throw new Error(`expectSnap ${step.index}: no top screen or no snapRects`);
			if (rectOff(top.rect, want) > 0.5) {
				violations.push({
					rule: "snap",
					frame: stack.trace.at(-1)?.frame ?? -1,
					scene: top.name,
					detail: `expected snap ${step.index} at y=${want.y.toFixed(1)} x=${want.x.toFixed(1)}, rests at y=${top.rect.y.toFixed(1)} x=${top.rect.x.toFixed(1)}`,
				});
			}
			return;
		}
		case "push":
			return stack.push(step.name);
		case "navigate":
			return stack.navigate(step.name);
		case "pop":
			return stack.goBack();
		case "replace":
			return stack.replace(step.name);
		case "settle":
			return stack.settle();
		case "frames":
			return stack.frames(step.count);
		case "swipe": {
			// Start on the top screen wherever it is now (cards shrink and move).
			const top = stack.trace.at(-1)?.scenes.at(-1)?.rect;
			const { from, to } = swipePath(step.direction, step.distance, top);
			return stack.gestures.drag(from, to, step.durationMs, { holdMs: step.holdMs });
		}
		case "pinch":
			return stack.gestures.pinch({ x: WINDOW.width / 2, y: WINDOW.height / 2 }, step.fromSpan, step.toSpan, step.durationMs);
	}
};

// Navigation actions must show motion within the start latency. (snapTo is checked by
// expectSnap instead: its target may already be on screen, e.g. a clamped overshoot.)
const ACTIONS = new Set(["push", "navigate", "pop", "replace"]);

export const runScenario = async (sim: ReanimatedSim, scenario: Scenario): Promise<ScenarioResult> => {
	const stack = await mountStack(sim, { screens: scenario.screens, screenOptions: scenario.screenOptions });
	const expectations = scenario.expect ?? {};
	const violations: Violation[] = [];
	await stack.settle();
	const fingerFrames = new Set<number>();
	const stepStarts = new Set<number>();
	try {
		for (const step of scenario.steps) {
			const before = stack.trace.length;
			if (step.op !== "settle" && step.op !== "frames") stepStarts.add(before);
			await runStep(stack, step, expectations, violations);
			if (ACTIONS.has(step.op)) {
				// The action ran between frames; the next frames must show it.
				await stack.frames((expectations.maxStartLatency ?? 3) + 1);
				violations.push(...checkStartLatency(stack.trace, before, expectations));
			}
			if (step.op === "swipe" || step.op === "pinch") {
				for (let i = before; i < stack.trace.length; i++) fingerFrames.add(i);
			}
		}
	} catch (error) {
		violations.push({ rule: "error", frame: stack.trace.at(-1)?.frame ?? -1, detail: String((error as Error)?.stack ?? error) });
	}
	await stack.settle();
	const trace = stack.trace;
	// Monotonic only applies within one step's motion, with no finger down.
	const runs: TraceFrame[][] = [];
	let current: TraceFrame[] = [];
	trace.forEach((frame, i) => {
		if (stepStarts.has(i) && current.length) {
			runs.push(current);
			current = [];
		}
		if (fingerFrames.has(i)) {
			if (current.length) runs.push(current);
			current = [];
		} else current.push(frame);
	});
	if (current.length) runs.push(current);
	violations.push(...checkFinite(trace), ...checkContinuity(trace, expectations), ...checkVanish(trace, expectations));
	const latency = (expectations.maxStartLatency ?? 3) + 1;
	for (const run of runs) violations.push(...checkMonotonic(run, expectations, latency));
	const routes = stack.routes();
	violations.push(...checkSettled(trace, routes, expectations));
	await stack.unmount();
	sim.reset();
	return { scenario, trace, routes, violations };
};
