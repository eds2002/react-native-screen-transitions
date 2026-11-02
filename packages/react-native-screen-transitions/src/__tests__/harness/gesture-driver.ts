/**
 * Drives the gestures the library registers (kept by the harness's
 * gesture-handler stand-in) with timed touches, the way gesture-handler does:
 *
 * - Touches go to every gesture on detectors above the touched screen
 *   (nested stacks included), deepest first.
 * - Manually activated gestures decide with `stateManager.activate()/fail()`
 *   from their touch handlers; the first gesture to activate wins and the
 *   others are cancelled (no simultaneous relations are modelled yet).
 * - The active gesture gets `onStart`, `onUpdate` per touch move (translation
 *   from the touch-down point, velocity in px/s) and `onEnd` on release.
 *
 * One touch sample is delivered just before each UI frame.
 */
import type { ReactTestInstance, ReactTestRenderer } from "react-test-renderer";
import { SCREEN_MARKER, type SceneFrame } from "./stack-harness";

type GestureLike = {
	type?: string;
	config: Record<string, unknown>;
	gestures?: GestureLike[];
};

type Handler = (...args: unknown[]) => void;

type Tracked = {
	gesture: GestureLike;
	/** Gestures in one Gesture.Simultaneous can be active together. */
	group: number;
	state: "pending" | "active" | "failed" | "cancelled" | "ended";
};

export type Point = { x: number; y: number };

let nextGroup = 0;

/** Leaf gestures with their simultaneity group (each leaf alone, unless composed simultaneously). */
const leaves = (gesture: GestureLike | undefined, group?: number): Array<{ gesture: GestureLike; group: number }> => {
	if (!gesture) return [];
	// Leaf gestures are Proxies that answer any property with a builder method.
	if (Array.isArray(gesture.gestures)) {
		const shared = gesture.type === "simultaneous" ? (group ?? nextGroup++) : undefined;
		return gesture.gestures.flatMap((child) => leaves(child, shared));
	}
	return [{ gesture, group: group ?? nextGroup++ }];
};

const call = (gesture: GestureLike, name: string, ...args: unknown[]) => {
	const handler = gesture.config[name];
	if (typeof handler === "function") (handler as Handler)(...args);
};

/** Detectors whose subtree holds the scene's marker, deepest first. */
const detectorsAbove = (renderer: ReactTestRenderer, scene: SceneFrame): GestureLike[] => {
	const marker = renderer.root.find(
		(node) => node.props.testID === `${SCREEN_MARKER}${scene.key}:${scene.name}` && typeof node.type === "string",
	);
	const found: GestureLike[] = [];
	let current: ReactTestInstance | null = marker;
	while (current) {
		if (current.type === "GestureDetector") found.push(current.props.gesture as GestureLike);
		current = current.parent;
	}
	return found;
};

const contains = (scene: SceneFrame, point: Point) =>
	point.x >= scene.rect.x &&
	point.x <= scene.rect.x + scene.rect.width &&
	point.y >= scene.rect.y &&
	point.y <= scene.rect.y + scene.rect.height;

export type GestureDriverHost = {
	renderer: ReactTestRenderer;
	/** The view a touch at this point lands on (React Native hit-testing). */
	hitTest: (point: Point) => ReactTestInstance | null;
	scrollOffset: (testID: string) => number;
	scrollTo: (testID: string, offset: number) => void;
	scrollLimit: (testID: string) => number;
	/** Scenes in paint order (last on top) as the recorder reads them now. */
	scenes: () => SceneFrame[];
	/** Runs one UI frame with the given UI-thread work done first. */
	frameWith: (beforeFrame: () => void) => Promise<unknown>;
	frameMs: number;
};

export const createGestureDriver = (host: GestureDriverHost) => {
	/**
	 * One finger (or two, for pinch) moving through `path` over `durationMs`,
	 * sampled once per frame, then lifted. Returns which gesture types activated.
	 */
	const touch = async ({
		path,
		durationMs,
		holdMs = 0,
		second,
		profile = "ease-in",
	}: {
		path: Point[];
		durationMs: number;
		/** Keep the finger still at the end before lifting (kills release velocity). */
		holdMs?: number;
		/** A second finger's path, sampled alongside the first (pinch). */
		second?: Point[];
		/** "ease-in": the finger accelerates (a hand); "linear": constant speed from touch-down (Maestro/Argent swipes, a flick already in motion). */
		profile?: "ease-in" | "linear";
	}) => {
		const start = path[0];
		const scenes = host.scenes();
		const target = [...scenes].reverse().find((scene) => scene.touchable && scene.opacity > 0 && contains(scene, start));
		if (!target) throw new Error(`no touchable screen under (${start.x}, ${start.y})`);
		// Gesture detectors above the touched view (scroll views included), else above the screen.
		const hit = host.hitTest(start);
		const detectors: GestureLike[] = [];
		let scrollView: ReactTestInstance | null = null;
		for (let node: ReactTestInstance | null = hit; node; node = node.parent) {
			if (node.type === "GestureDetector") detectors.push(node.props.gesture as GestureLike);
			if (!scrollView && typeof node.props.testID === "string" && node.props.testID.startsWith("harness-scroll:")) scrollView = node;
		}
		const all: Tracked[] = (hit ? detectors : detectorsAbove(host.renderer, target))
			.flatMap((detector) => leaves(detector))
			.filter(({ gesture }) => gesture.config.enabled !== false)
			.map(({ gesture, group }) => ({ gesture, group, state: "pending" }));
		// Native (scroll) gestures only hear touches; screen gestures decide.
		const natives = all.filter((entry) => entry.gesture.type === "native");
		const tracked = all.filter((entry) => entry.gesture.type !== "native");
		const scrollId = scrollView ? String(scrollView.props.testID) : null;
		let scrollFrom: { offset: number; at: Point } | null = null;

		const frames = Math.max(1, Math.round(durationMs / host.frameMs));
		const holdFrames = Math.round(holdMs / host.frameMs);
		const sample = (points: Point[], t: number): Point => {
			const scaled = t * (points.length - 1);
			const i = Math.min(points.length - 2, Math.floor(scaled));
			if (points.length === 1) return points[0];
			const f = scaled - i;
			return { x: points[i].x + (points[i + 1].x - points[i].x) * f, y: points[i].y + (points[i + 1].y - points[i].y) * f };
		};
		const history: Array<{ time: number; p: Point; p2?: Point }> = [];
		let time = 0;
		const touchEvent = (p: Point, p2: Point | undefined, eventType: string) => {
			const all = [{ id: 0, x: p.x, y: p.y, absoluteX: p.x, absoluteY: p.y }];
			if (p2) all.push({ id: 1, x: p2.x, y: p2.y, absoluteX: p2.x, absoluteY: p2.y });
			return { eventType, allTouches: all, changedTouches: all, numberOfTouches: all.length };
		};
		const gestureEvent = (p: Point, p2?: Point) => {
			const last = history.at(-1) ?? { time, p, p2 };
			const prior = history.at(-4) ?? history[0] ?? last;
			const dt = Math.max(1e-3, (last.time - prior.time) / 1000);
			const s0 = second ? Math.hypot(second[0].x - start.x, second[0].y - start.y) : 1;
			const span = p2 ? Math.hypot(p2.x - p.x, p2.y - p.y) : s0;
			const priorSpan = prior.p2 ? Math.hypot(prior.p2.x - prior.p.x, prior.p2.y - prior.p.y) : s0;
			const focal = p2 ? { x: (p.x + p2.x) / 2, y: (p.y + p2.y) / 2 } : p;
			return {
				x: focal.x,
				y: focal.y,
				absoluteX: focal.x,
				absoluteY: focal.y,
				translationX: p.x - start.x,
				translationY: p.y - start.y,
				velocityX: (last.p.x - prior.p.x) / dt,
				velocityY: (last.p.y - prior.p.y) / dt,
				numberOfPointers: p2 ? 2 : 1,
				scale: span / s0,
				velocity: (span - priorSpan) / s0 / dt,
				focalX: focal.x,
				focalY: focal.y,
				state: 4,
			};
		};
		const manager = (entry: Tracked) => ({
			activate: () => {
				if (entry.state !== "pending") return;
				if (tracked.some((other) => other.state === "active" && other.group !== entry.group)) {
					entry.state = "cancelled";
					return;
				}
				entry.state = "active";
				for (const other of tracked) {
					if (other !== entry && other.state === "pending" && other.group !== entry.group) other.state = "cancelled";
				}
			},
			fail: () => {
				if (entry.state === "pending") entry.state = "failed";
			},
			begin: () => {},
			end: () => {},
		});

		const activated: string[] = [];
		const step = (p: Point, p2: Point | undefined, kind: "down" | "move" | "up") => {
			if (kind !== "up") history.push({ time, p, p2 });
			const event = touchEvent(p, p2, kind);
			for (const native of natives) {
				call(native.gesture, kind === "down" ? "onTouchesDown" : kind === "up" ? "onTouchesUp" : "onTouchesMove", event, manager(native));
			}
			// The scroll view moves once every screen gesture has failed (it waits for them).
			if (scrollId && kind === "move" && tracked.every((e) => e.state === "failed" || e.state === "cancelled")) {
				if (!scrollFrom) scrollFrom = { offset: host.scrollOffset(scrollId), at: p };
				const horizontal = !!scrollView?.props.horizontal;
				const delta = horizontal ? p.x - scrollFrom.at.x : p.y - scrollFrom.at.y;
				const next = Math.min(host.scrollLimit(scrollId), Math.max(0, scrollFrom.offset - delta));
				if (next !== host.scrollOffset(scrollId)) host.scrollTo(scrollId, next);
			}
			for (const entry of tracked) {
				if (entry.state === "failed" || entry.state === "cancelled" || entry.state === "ended") continue;
				if (kind === "down") {
					call(entry.gesture, "onTouchesDown", event, manager(entry));
					continue;
				}
				if (kind === "up") {
					call(entry.gesture, "onTouchesUp", event, manager(entry));
					if (entry.state === "active") {
						call(entry.gesture, "onEnd", gestureEvent(p, p2), true);
						call(entry.gesture, "onFinalize", gestureEvent(p, p2), true);
					}
					entry.state = "ended";
					continue;
				}
				const wasActive = entry.state === "active";
				call(entry.gesture, "onTouchesMove", event, manager(entry));
				if (!wasActive && entry.state === "active") {
					activated.push(entry.gesture.type ?? "?");
					call(entry.gesture, "onBegin", gestureEvent(p, p2));
					call(entry.gesture, "onStart", gestureEvent(p, p2));
				} else if (wasActive) {
					call(entry.gesture, "onUpdate", gestureEvent(p, p2));
				}
			}
		};

		await host.frameWith(() => step(start, second?.[0], "down"));
		const end = path.at(-1) as Point;
		const end2 = second?.at(-1);
		for (let i = 1; i <= frames; i++) {
			time += host.frameMs;
			// Fingers accelerate into a swipe: ease in, so little travel builds up before activation.
			const t = profile === "linear" ? i / frames : (i / frames) ** 2;
			const p = sample(path, t);
			const p2 = second ? sample(second, t) : undefined;
			// The finger lifts with its last move, in the same frame.
			const lifts = i === frames && holdFrames === 0;
			await host.frameWith(() => {
				step(p, p2, "move");
				if (lifts) step(end, end2, "up");
			});
		}
		for (let i = 1; i <= holdFrames; i++) {
			time += host.frameMs;
			await host.frameWith(() => {
				step(end, end2, "move");
				if (i === holdFrames) step(end, end2, "up");
			});
		}
		return { activated, target: target.name };
	};

	return {
		touch,
		/** A one-finger drag from `from` to `to`. */
		drag: (from: Point, to: Point, durationMs: number, opts: { holdMs?: number; profile?: "ease-in" | "linear" } = {}) =>
			touch({ path: [from, to], durationMs, ...opts }),
		/** Two fingers spreading (scale > 1) or closing (scale < 1) about `center`. */
		pinch: (center: Point, fromSpan: number, toSpan: number, durationMs: number) =>
			touch({
				path: [
					{ x: center.x - fromSpan / 2, y: center.y },
					{ x: center.x - toSpan / 2, y: center.y },
				],
				second: [
					{ x: center.x + fromSpan / 2, y: center.y },
					{ x: center.x + toSpan / 2, y: center.y },
				],
				durationMs,
			}),
	};
};
