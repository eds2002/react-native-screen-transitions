/**
 * Rules every transition trace must satisfy, whatever the scenario. A scenario
 * gets these for free; it only states what is special about it (a resting
 * pose that is not the full window, motion that may overshoot...).
 */
import { WINDOW } from "./install";
import type { Rect, SceneFrame, TraceFrame } from "./stack-harness";

export type Violation = { rule: string; frame: number; scene?: string; detail: string };

export type Expectations = {
	/** Where the top screen rests (default: the full window). Null skips the check. */
	restRect?: Rect | null;
	/** Per screen name: where it may rest when it is on top (any of these). Overrides restRect. */
	rest?: Record<string, Rect[] | null>;
	/** A sheet's pose at each snap index (sorted snap points), for `expectSnap` steps. */
	snapRects?: Rect[];
	/** Frames an action may take to show any motion (default 3). */
	maxStartLatency?: number;
	/** Motion without a finger may overshoot its target (springs that bounce). */
	mayOvershoot?: boolean;
	/** No transitionSpec: screens switch in one frame, so motion rules do not apply. */
	instant?: boolean;
};

const visible = (scene: SceneFrame) =>
	scene.opacity > 0.01 &&
	scene.rect.x < WINDOW.width &&
	scene.rect.x + scene.rect.width > 0 &&
	scene.rect.y < WINDOW.height &&
	scene.rect.y + scene.rect.height > 0;

const pose = (scene: SceneFrame) => [
	scene.rect.x,
	scene.rect.y,
	scene.rect.width,
	scene.rect.height,
	scene.opacity * 100,
];

const distance = (a: number[], b: number[]) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));

const numbersIn = (value: unknown, out: number[] = []): number[] => {
	if (typeof value === "number") out.push(value);
	else if (Array.isArray(value)) for (const v of value) numbersIn(v, out);
	else if (value && typeof value === "object") for (const v of Object.values(value)) numbersIn(v, out);
	return out;
};

/** Every opacity a layer receives is within [0, 1] (React Native clamps it, but it means an unclamped interpolation). */
export const checkStyleRange = (trace: TraceFrame[]): Violation[] => {
	const out: Violation[] = [];
	const seen = new Set<string>();
	for (const frame of trace) {
		for (const scene of frame.scenes) {
			for (const layer of scene.layers) {
				const o = layer.style.opacity;
				if (typeof o === "number" && (o < -1e-3 || o > 1 + 1e-3) && !seen.has(scene.key)) {
					seen.add(scene.key);
					out.push({ rule: "style-range", frame: frame.frame, scene: scene.name, detail: `opacity ${o.toFixed(3)} on ${layer.type}` });
				}
			}
		}
	}
	return out;
};

/** No NaN or Infinity in any pose or any style value a layer received. */
export const checkFinite = (trace: TraceFrame[]): Violation[] => {
	const out: Violation[] = [];
	for (const frame of trace) {
		for (const scene of frame.scenes) {
			const values = [...pose(scene), ...scene.layers.flatMap((l) => numbersIn(l.style))];
			if (values.some((v) => !Number.isFinite(v))) {
				out.push({ rule: "finite", frame: frame.frame, scene: scene.name, detail: JSON.stringify(scene.layers.map((l) => l.style)) });
			}
		}
	}
	return out;
};

const byScene = (trace: TraceFrame[]) => {
	const series = new Map<string, Array<{ frame: number; scene: SceneFrame } | undefined>>();
	trace.forEach((frame, index) => {
		for (const scene of frame.scenes) {
			if (!series.has(scene.key)) series.set(scene.key, new Array(trace.length).fill(undefined));
			(series.get(scene.key) as Array<{ frame: number; scene: SceneFrame } | undefined>)[index] = {
				frame: frame.frame,
				scene,
			};
		}
	});
	return series;
};

/**
 * A visible screen never jumps away for a frame or two and comes back (a
 * flash), never moves more than 45% of the window in one frame while staying
 * visible (a teleport), and never takes one step far larger than the steps
 * around it (a spike: smooth motion changes speed gradually).
 */
export const checkContinuity = (trace: TraceFrame[], expectations: Expectations = {}): Violation[] => {
	if (expectations.instant) return [];
	const out: Violation[] = [];
	for (const [key, series] of byScene(trace)) {
		for (let i = 1; i < series.length; i++) {
			const prev = series[i - 1];
			const cur = series[i];
			if (!prev || !cur || !visible(prev.scene) || !visible(cur.scene)) continue;
			// A change under an opaque screen in both frames is not seen.
			const hidden = (index: number) => {
				const frame = trace[index];
				const at = frame.scenes.findIndex((s) => s.key === key);
				return at >= 0 && shownFraction(frame, at) < 0.01;
			};
			if (hidden(i - 1) && hidden(i)) continue;
			const jump = distance(pose(prev.scene), pose(cur.scene));
			// Per axis: 45% of the window along it (opacity: 0.45).
			const a = pose(prev.scene);
			const b = pose(cur.scene);
			const limits = [WINDOW.width, WINDOW.height, WINDOW.width, WINDOW.height, 100].map((size) => 0.45 * size);
			if (a.some((v, k) => Math.abs(v - b[k]) > limits[k])) {
				out.push({ rule: "teleport", frame: cur.frame, scene: cur.scene.name, detail: `${pose(prev.scene).map((v) => v.toFixed(1))} -> ${pose(cur.scene).map((v) => v.toFixed(1))}` });
			}
			const before = series[i - 2];
			const after = series[i + 1];
			if (before && after && visible(before.scene) && visible(after.scene)) {
				const stepBefore = distance(pose(before.scene), pose(prev.scene));
				const stepAfter = distance(pose(cur.scene), pose(after.scene));
				if (jump > 30 && jump > 4 * Math.max(stepBefore, stepAfter, 2)) {
					out.push({ rule: "spike", frame: cur.frame, scene: cur.scene.name, detail: `step ${jump.toFixed(1)} between steps ${stepBefore.toFixed(1)} and ${stepAfter.toFixed(1)}` });
				}
			}
			const stepIn = before && visible(before.scene) ? distance(pose(before.scene), pose(prev.scene)) : 0;
			// Back within about two 60 Hz frames, whatever the display rate.
			for (let span = 1; span <= 8; span++) {
				const back = series[i + span];
				if (back && trace[i + span].time - trace[i].time > 34) break;
				// A flash starts abruptly: motion that was already this fast and turns back is a reversal.
				if (!back || !visible(back.scene) || jump < 20 || jump < 3 * stepIn) continue;
				if (distance(pose(prev.scene), pose(back.scene)) < jump / 5 && distance(pose(cur.scene), pose(back.scene)) > 20) {
					out.push({ rule: "flash", frame: cur.frame, scene: cur.scene.name, detail: `out ${jump.toFixed(1)} and back within ${span} frame(s)` });
				}
			}
		}
	}
	return out;
};

/**
 * The fraction of the window where a scene shows: inside the window and its
 * rect, not under an opaque scene painted above it (sampled on a grid).
 */
const shownFraction = (frame: TraceFrame, index: number) => {
	const scene = frame.scenes[index];
	const above = frame.scenes.slice(index + 1).filter((s) => s.opacity >= 0.999);
	const inside = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
	let shown = 0;
	const cols = 39;
	const rows = 84;
	for (let i = 0; i < cols; i++) {
		for (let j = 0; j < rows; j++) {
			const x = ((i + 0.5) / cols) * WINDOW.width;
			const y = ((j + 0.5) / rows) * WINDOW.height;
			if (inside(scene.rect, x, y) && !above.some((s) => inside(s.rect, x, y))) shown++;
		}
	}
	return shown / (cols * rows);
};

/**
 * A screen you can see (on screen, not covered) does not disappear from one
 * frame to the next: closing screens leave by animating out.
 */
export const checkVanish = (trace: TraceFrame[], expectations: Expectations = {}): Violation[] => {
	if (expectations.instant) return [];
	const out: Violation[] = [];
	for (let i = 1; i < trace.length; i++) {
		const prev = trace[i - 1];
		const cur = trace[i];
		prev.scenes.forEach((scene, index) => {
			if (!visible(scene)) return;
			const shown = shownFraction(prev, index);
			if (shown * scene.opacity < 0.05) return;
			const next = cur.scenes.find((s) => s.key === scene.key);
			// Moving off screen is leaving; being removed or blinking out is vanishing.
			const blinked = next && next.opacity < 0.01 && scene.opacity - next.opacity > 0.5;
			if (!next || blinked) {
				out.push({ rule: "vanish", frame: cur.frame, scene: scene.name, detail: `${(shown * 100).toFixed(0)}% of the window at opacity ${scene.opacity.toFixed(2)} disappeared in one frame` });
			}
		});
	}
	return out;
};

/**
 * Without a finger, a screen moves towards one end and does not turn back
 * (unless springs may overshoot). `settleFrames` at the start of the run are
 * skipped: motion an action interrupts may carry on until the action starts.
 */
export const checkMonotonic = (trace: TraceFrame[], expectations: Expectations, settleFrames = 0): Violation[] => {
	if (expectations.mayOvershoot || expectations.instant) return [];
	const out: Violation[] = [];
	for (const [key, series] of byScene(trace)) {
		const hidden = (index: number) => {
			const frame = trace[index];
			const at = frame.scenes.findIndex((s) => s.key === key);
			return at >= 0 && shownFraction(frame, at) < 0.01;
		};
		for (let axis = 0; axis < 5; axis++) {
			let direction = 0;
			for (let i = Math.max(1, settleFrames); i < series.length; i++) {
				const prev = series[i - 1];
				const cur = series[i];
				if (!prev || !cur || !visible(prev.scene) || !visible(cur.scene) || (hidden(i - 1) && hidden(i))) {
					direction = 0;
					continue;
				}
				const delta = pose(cur.scene)[axis] - pose(prev.scene)[axis];
				// Below a pixel: rounding where two motions meet, not a visible turn.
				if (Math.abs(delta) < 1) continue;
				const sign = Math.sign(delta);
				if (direction !== 0 && sign !== direction) {
					out.push({ rule: "turns-back", frame: cur.frame, scene: cur.scene.name, detail: `axis ${["x", "y", "w", "h", "opacity"][axis]} reversed by ${delta.toFixed(2)}` });
					break;
				}
				direction = sign;
			}
		}
	}
	return out;
};

/** Something visibly changes within `maxStartLatency` frames of an action. */
export const checkStartLatency = (trace: TraceFrame[], actionIndex: number, expectations: Expectations): Violation[] => {
	const limit = expectations.maxStartLatency ?? 3;
	const before = trace[actionIndex - 1];
	if (!before) return [];
	const signature = (frame: TraceFrame) =>
		JSON.stringify(frame.scenes.filter(visible).map((s) => [s.key, pose(s).map((v) => v.toFixed(2))]));
	const base = signature(before);
	for (let i = actionIndex; i < Math.min(trace.length, actionIndex + limit + 1); i++) {
		if (signature(trace[i]) !== base) return [];
	}
	return [{ rule: "start-latency", frame: trace[actionIndex]?.frame ?? -1, detail: `nothing moved within ${limit} frames` }];
};

/**
 * Once settled: the screens rendered are the routes, the top route is visible,
 * opaque, takes touches and rests where expected.
 */
export const checkSettled = (
	trace: TraceFrame[],
	routes: Array<{ key: string; name: string }>,
	expectations: Expectations,
): Violation[] => {
	const out: Violation[] = [];
	const last = trace.at(-1);
	if (!last) return out;
	const routeKeys = new Set(routes.map((r) => r.key));
	for (const scene of last.scenes) {
		if (!routeKeys.has(scene.key)) {
			out.push({ rule: "ghost-screen", frame: last.frame, scene: scene.name, detail: `rendered but not a route (${scene.key})` });
		}
	}
	const top = routes.at(-1);
	const topScene = last.scenes.find((s) => s.key === top?.key);
	if (!topScene) {
		out.push({ rule: "top-missing", frame: last.frame, scene: top?.name, detail: "top route is not rendered" });
		return out;
	}
	if (!topScene.touchable) out.push({ rule: "top-untouchable", frame: last.frame, scene: top?.name, detail: "settled top screen does not take touches" });
	if (Math.abs(topScene.opacity - 1) > 1e-3) out.push({ rule: "top-faded", frame: last.frame, scene: top?.name, detail: `opacity ${topScene.opacity}` });
	const fallback = expectations.restRect === undefined ? [{ x: 0, y: 0, ...WINDOW }] : expectations.restRect ? [expectations.restRect] : null;
	const allowed = top && expectations.rest && top.name in expectations.rest ? expectations.rest[top.name] : fallback;
	if (allowed && !allowed.some((rest) => rectOff(topScene.rect, rest) <= 0.5)) {
		out.push({ rule: "top-rest", frame: last.frame, scene: top?.name, detail: `rests at ${JSON.stringify(roundRect(topScene.rect))}, expected one of ${JSON.stringify(allowed.map(roundRect))}` });
	}
	return out;
};

export const rectOff = (a: Rect, b: Rect) =>
	Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y), Math.abs(a.width - b.width), Math.abs(a.height - b.height));

const roundRect = (r: Rect) => ({ x: +r.x.toFixed(1), y: +r.y.toFixed(1), width: +r.width.toFixed(1), height: +r.height.toFixed(1) });

/**
 * Elements (styleId views) and overlays as their own scenes, so the finite and
 * continuity rules apply to them too.
 */
export const elementTrace = (trace: TraceFrame[]): TraceFrame[] =>
	trace.map((frame) => ({
		...frame,
		overlays: [],
		scenes: [
			...frame.scenes.flatMap((scene) =>
				Object.entries(scene.elements).map(([id, element]) => ({
					key: `${scene.key}#${id}`,
					name: `${scene.name}#${id}`,
					rect: element.rect,
					opacity: element.opacity,
					touchable: true,
					approx3d: false,
					layers: [{ type: "element", style: element.style }],
					elements: {},
				})),
			),
			...frame.overlays.map((overlay) => ({
				key: `overlay:${overlay.owner}`,
				name: `overlay(${overlay.owner})`,
				rect: overlay.rect,
				opacity: overlay.opacity,
				touchable: true,
				approx3d: false,
				layers: [],
				elements: {},
			})),
		],
	}));
