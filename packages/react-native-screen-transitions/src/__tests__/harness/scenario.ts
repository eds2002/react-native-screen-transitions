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
	checkStyleRange,
	checkVanish,
	elementTrace,
	type Expectations,
	rectOff,
	type Violation,
} from "./invariants";
import type { ReanimatedSim } from "./reanimated-sim";
import { mountStack, type ScreenSpec, type StackHarness, type TraceFrame } from "./stack-harness";

export type SwipeDirection = "horizontal" | "horizontal-inverted" | "vertical" | "vertical-inverted";

export type Step =
	| { op: "push"; name: string; params?: object }
	| { op: "navigate"; name: string; params?: object }
	/** Pushes onto the nested stack at `path` (route names from the root). */
	| { op: "pushIn"; path: string[]; name: string; params?: object }
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
			/** Start here instead of inside the focused screen. */
			from?: { x: number; y: number };
			/** Finger speed profile (default "ease-in"). */
			profile?: "ease-in" | "linear";
	  }
	/** Settles, then checks a screen (by route name; the last one with that name) is absent, rendered but hidden, or shown. */
	| { op: "expectScene"; name: string; state: "absent" | "hidden" | "shown" }
	/** The named screen's navigation.setOptions. */
	| { op: "setOptions"; name: string; options: Record<string, unknown> }
	/**
	 * Settles, then checks the motion since the last action: the first frame a
	 * screen (or one of its elements) is visible starts near `from`, and its last
	 * visible frame ends near `to` (centers within `tolerance` px, sizes within
	 * 35%).
	 */
	| {
			op: "expectTrajectory";
			scene: string;
			element?: string;
			from?: { x: number; y: number; width: number; height: number };
			to?: { x: number; y: number; width: number; height: number };
			tolerance?: number;
			/** Count frames where it is transparent too (screens that fade as they land). */
			throughFade?: boolean;
	  }
	/**
	 * Scrolls the focused screen's scroll view (or `screen`'s) to an offset (as if the user had
	 * scrolled there). `inner` scrolls the scroll view nested inside it instead.
	 */
	| { op: "scrollTo"; offset: number; screen?: string; inner?: boolean }
	/** Checks the focused screen's scroll offset. */
	| { op: "expectScroll"; min?: number; max?: number }
	/** Settles, then checks the focused screen's styleId element sits exactly on its screen (no leftover slot style). */
	| { op: "expectElementAtRest"; styleId: string }
	/** Settles, then checks the overlays rendered: the focused route they show (none: no overlay). */
	| { op: "expectOverlay"; focused: string | null }
	| { op: "pinch"; fromSpan: number; toSpan: number; durationMs: number }
	/** The library's `snapTo(index)` on the focused screen. */
	| { op: "snapTo"; index: number }
	/** Settles, then checks the top screen rests at `expect.snapRects[index]`. */
	| { op: "expectSnap"; index: number }
	/** A tap at a window point (hit-tested like React Native). */
	| { op: "tap"; at: { x: number; y: number } }
	/** Settles, then checks the route names, bottom to top. */
	| { op: "expectRoutes"; names: string[] }
	/** Settles, then checks the route names from the root to the focused screen. */
	| { op: "expectPath"; names: string[] }
	/** Checks how many taps each named screen's surface received so far. */
	| { op: "expectTaps"; counts: Record<string, number> };

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

let lastActionIndex = 0;

const near = (a: { x: number; y: number; width: number; height: number }, b: typeof a, tolerance: number) => {
	const ca = { x: a.x + a.width / 2, y: a.y + a.height / 2 };
	const cb = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
	const sized = (u: number, v: number) => Math.abs(u - v) <= 0.35 * Math.max(u, v);
	return Math.hypot(ca.x - cb.x, ca.y - cb.y) <= tolerance && sized(a.width, b.width) && sized(a.height, b.height);
};

const runStep = async (stack: StackHarness, step: Step, expectations: Expectations, violations: Violation[]) => {
	switch (step.op) {
		case "expectTrajectory": {
			await stack.settle();
			const tolerance = step.tolerance ?? 40;
			const poses = stack.trace
				.slice(lastActionIndex)
				.map((frame) => {
					const scene = frame.scenes.filter((s) => s.name === step.scene).at(-1);
					if (!scene) return null;
					const pose = step.element ? scene.elements[step.element] : { rect: scene.rect, opacity: scene.opacity };
					if (!pose || (!step.throughFade && pose.opacity < 0.05)) return null;
					const r = pose.rect;
					const onScreen = r.x < WINDOW.width && r.x + r.width > 0 && r.y < WINDOW.height && r.y + r.height > 0;
					return onScreen ? r : null;
				})
				.filter((r): r is NonNullable<typeof r> => !!r);
			const label = `${step.scene}${step.element ? `#${step.element}` : ""}`;
			const fmt = (r: { x: number; y: number; width: number; height: number }) =>
				`${r.x.toFixed(0)},${r.y.toFixed(0)} ${r.width.toFixed(0)}x${r.height.toFixed(0)}`;
			if (!poses.length) {
				violations.push({ rule: "trajectory", frame: stack.trace.at(-1)?.frame ?? -1, scene: label, detail: "never visible" });
				return;
			}
			if (step.from && !near(poses[0], step.from, tolerance)) {
				violations.push({ rule: "trajectory", frame: stack.trace.at(-1)?.frame ?? -1, scene: label, detail: `starts at ${fmt(poses[0])}, expected near ${fmt(step.from)}` });
			}
			const end = poses.at(-1) as (typeof poses)[number];
			if (step.to && !near(end, step.to, tolerance)) {
				violations.push({ rule: "trajectory", frame: stack.trace.at(-1)?.frame ?? -1, scene: label, detail: `ends at ${fmt(end)}, expected near ${fmt(step.to)}` });
			}
			return;
		}
		case "snapTo":
			return stack.js(() => snapTo(step.index));
		case "tap":
			return stack.tap(step.at);
		case "expectRoutes": {
			await stack.settle();
			const names = stack.routes().map((r) => r.name);
			if (JSON.stringify(names) !== JSON.stringify(step.names)) {
				violations.push({ rule: "routes", frame: stack.trace.at(-1)?.frame ?? -1, detail: `routes ${JSON.stringify(names)}, expected ${JSON.stringify(step.names)}` });
			}
			return;
		}
		case "expectTaps": {
			for (const [name, count] of Object.entries(step.counts)) {
				if ((stack.taps[name] ?? 0) !== count) {
					violations.push({ rule: "taps", frame: stack.trace.at(-1)?.frame ?? -1, scene: name, detail: `${name} received ${stack.taps[name] ?? 0} taps, expected ${count}` });
				}
			}
			return;
		}
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
			return stack.push(step.name, step.params);
		case "navigate":
			return stack.navigate(step.name, step.params);
		case "pushIn":
			return stack.pushIn(step.path, step.name, step.params);
		case "expectPath": {
			await stack.settle();
			const names = stack.focusedPath();
			if (JSON.stringify(names) !== JSON.stringify(step.names)) {
				violations.push({ rule: "path", frame: stack.trace.at(-1)?.frame ?? -1, detail: `focused path ${JSON.stringify(names)}, expected ${JSON.stringify(step.names)}` });
			}
			return;
		}
		case "pop":
			return stack.goBack();
		case "replace":
			return stack.replace(step.name);
		case "settle":
			return stack.settle();
		case "frames":
			return stack.frames(step.count);
		case "swipe": {
			// Start on the focused screen wherever it is now (cards shrink and move).
			const focusedKey = stack.leafRoutes().at(-1)?.key;
			const scenes = stack.trace.at(-1)?.scenes ?? [];
			const top = (scenes.find((s) => s.key === focusedKey) ?? scenes.at(-1))?.rect;
			const path = swipePath(step.direction, step.distance, top);
			const from = step.from ?? path.from;
			const to = step.from ? { x: from.x + path.to.x - path.from.x, y: from.y + path.to.y - path.from.y } : path.to;
			return stack.gestures.drag(from, to, step.durationMs, { holdMs: step.holdMs, profile: step.profile });
		}
		case "expectScene": {
			await stack.settle();
			const scene = stack.trace
				.at(-1)
				?.scenes.filter((s) => s.name === step.name)
				.at(-1);
			const state = !scene ? "absent" : scene.opacity < 0.01 ? "hidden" : "shown";
			if (state !== step.state) {
				violations.push({ rule: "scene-state", frame: stack.trace.at(-1)?.frame ?? -1, scene: step.name, detail: `${step.name} is ${state}, expected ${step.state}` });
			}
			return;
		}
		case "expectElementAtRest": {
			await stack.settle();
			const focusedKey = stack.leafRoutes().at(-1)?.key;
			const scene = stack.trace.at(-1)?.scenes.find((s) => s.key === focusedKey);
			const element = scene?.elements[step.styleId];
			if (!scene || !element) throw new Error(`no ${step.styleId} element on the focused screen`);
			if (rectOff(element.rect, scene.rect) > 0.5 || Math.abs(element.opacity - scene.opacity) > 1e-3) {
				violations.push({
					rule: "element-rest",
					frame: stack.trace.at(-1)?.frame ?? -1,
					scene: `${scene.name}#${step.styleId}`,
					detail: `rests at ${JSON.stringify(element.rect)} opacity ${element.opacity.toFixed(3)}, its screen at ${JSON.stringify(scene.rect)} opacity ${scene.opacity.toFixed(3)}; style ${JSON.stringify(element.style)}`,
				});
			}
			return;
		}
		case "expectOverlay": {
			await stack.settle();
			const overlays = stack.trace.at(-1)?.overlays ?? [];
			const shown = overlays.filter((o) => o.opacity > 0.01);
			const ok = step.focused === null ? shown.length === 0 : shown.length > 0 && shown.every((o) => o.focused === step.focused);
			if (!ok) {
				violations.push({ rule: "overlay", frame: stack.trace.at(-1)?.frame ?? -1, detail: `overlays ${JSON.stringify(shown.map((o) => `${o.owner}->${o.focused}`))}, expected focused ${step.focused}` });
			}
			return;
		}
		case "scrollTo":
			return step.screen ? stack.scrollScreenTo(step.screen, step.offset, step.inner) : stack.scrollFocusedTo(step.offset, step.inner);
		case "expectScroll": {
			await stack.settle();
			const key = stack.leafRoutes().at(-1)?.key;
			const offset = stack.scrollOffsets.get(`harness-scroll:${key}`) ?? 0;
			if ((step.min !== undefined && offset < step.min) || (step.max !== undefined && offset > step.max)) {
				violations.push({ rule: "scroll", frame: stack.trace.at(-1)?.frame ?? -1, detail: `scroll offset ${offset.toFixed(1)}, expected ${step.min ?? "-inf"}..${step.max ?? "inf"}` });
			}
			return;
		}
		case "setOptions": {
			return stack.setOptions(step.name, step.options);
		}
		case "pinch":
			return stack.gestures.pinch({ x: WINDOW.width / 2, y: WINDOW.height / 2 }, step.fromSpan, step.toSpan, step.durationMs);
	}
};

// Navigation actions must show motion within the start latency. (snapTo is checked by
// expectSnap instead: its target may already be on screen, e.g. a clamped overshoot.)
const ACTIONS = new Set(["push", "navigate", "pushIn", "pop", "replace"]);

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
			if (ACTIONS.has(step.op) || step.op === "swipe" || step.op === "pinch" || step.op === "tap") lastActionIndex = before;
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
	violations.push(
		...checkFinite(trace),
		...checkStyleRange(trace),
		...checkContinuity(trace, expectations),
		...checkVanish(trace, expectations),
	);
	const elements = elementTrace(trace);
	violations.push(
		...checkFinite(elements).map((v) => ({ ...v, rule: `element-${v.rule}` })),
		...checkContinuity(elements, expectations).map((v) => ({ ...v, rule: `element-${v.rule}` })),
	);
	const latency = (expectations.maxStartLatency ?? 3) + 1;
	for (const run of runs) violations.push(...checkMonotonic(run, expectations, latency));
	const routes = stack.leafRoutes();
	violations.push(...checkSettled(trace, routes, expectations));
	await stack.unmount();
	sim.reset();
	return { scenario, trace, routes, violations };
};
