// @ts-nocheck
/**
 * The debug bridge Argent reads to assert on the harness.
 *
 * - `globalThis.__harness` (Argent `debugger-evaluate`, debug builds):
 *     state()            full state: lab, navigation, focused path, screens, settled, errors
 *     summary()          the compact form below
 *     setLevel(n)        0 off (perf runs), 1 state changes (default), 2 + per-frame progress
 *     startRecording()   level 2 and clear frames;  stopRecording() → frames
 *     reset()            clear errors and frames
 * - `harness-state` (Argent `describe` / `ui-tree`, works in Release): a hidden
 *   accessibility element whose label is summary() as JSON:
 *     { lab, path, depth, settled, screens: [{ n, p, a, c, d }], errors, frames, counts }
 *   d: the screen's pan/pinch gesture is dragging; counts["drag:<name>"] counts drags that started
 *   depth: routes in the innermost focused navigator
 *   counts: named events labs report with bridge.count() (button presses), reset when a lab opens
 *   notes: named values labs report with bridge.note() (what the last press asked for), reset likewise
 *
 * Screens report through `ScreenReporter`, which `Page` renders.
 */
import { Component, useEffect, useState } from "react";
import { View } from "react-native";
import { makeMutable, useAnimatedReaction, useFrameCallback } from "react-native-reanimated";
import { useScreenAnimation } from "react-native-screen-transitions";
import { scheduleOnRN } from "react-native-worklets";

type ScreenState = { key: string; name: string; progress: number; animating: boolean; closing: boolean; settled: boolean; dragging: boolean; mounted: number };
type Frame = { t: number; key: string; name: string; progress: number };

/** 0 off, 1 state changes, 2 state changes and every frame's progress. Read on the UI thread. */
export const bridgeLevel = makeMutable(1);

/**
 * UI-thread frame monitor, counted from the app's own frame callbacks (not the recording):
 * frames seen, frames dropped (a callback later than one refresh), late frames (over 1.25 refreshes,
 * which can miss the display's deadline even when not counted as dropped), and the longest frame in ms.
 * Frame callbacks also run on touch and other events between frames: ones less than half a refresh
 * after the last frame are skipped. The refresh interval is 60 Hz unless set (harness://perf/hz/120).
 */
const perf = makeMutable({ frames: 0, dropped: 0, late: 0, worst: 0, vsync: 1000 / 60, last: -1 });
/** Synthetic UI-thread work per frame in ms (harness://perf/load/<ms>): how much headroom the transitions leave. */
const perfLoad = makeMutable(0);
/** Press-to-first-motion latency in ms: [push, pop] lists, since the last reset. */
const latency = { push: [] as number[], pop: [] as number[] };
const pressedAt: Record<string, number> = {};
const resetPerf = (hz?: number) => {
	perf.value = { frames: 0, dropped: 0, late: 0, worst: 0, vsync: hz ? 1000 / hz : perf.value.vsync, last: -1 };
	latency.push = [];
	latency.pop = [];
};
const median = (xs: number[]) => {
	if (!xs.length) return null;
	const sorted = [...xs].sort((a, b) => a - b);
	return sorted[Math.floor(sorted.length / 2)];
};

const state = {
	lab: null as string | null,
	nav: null as unknown,
	screens: new Map<string, ScreenState>(),
	errors: [] as Array<{ t: number; message: string }>,
	frames: [] as Frame[],
	counts: {} as Record<string, number>,
	notes: {} as Record<string, string>,
	version: 0,
};
const listeners = new Set<() => void>();
const changed = () => {
	state.version++;
	for (const listener of listeners) listener();
};

const focusedPath = (nav) => {
	const path = [];
	let s = nav;
	while (s?.routes) {
		const route = s.routes[s.index ?? s.routes.length - 1];
		path.push(route.name);
		s = route.state;
	}
	return path;
};

/** Number of routes in the innermost focused navigator. */
const focusedDepth = (nav) => {
	let s = nav;
	let depth = 0;
	while (s?.routes) {
		depth = s.routes.length;
		s = s.routes[s.index ?? s.routes.length - 1].state;
	}
	return depth;
};

// A closing screen has settled once its close finished (a standalone unit stays mounted, closed).
const isSettled = () => [...state.screens.values()].every((s) => !s.animating && (!s.closing || s.progress === 0));

const summary = () => ({
	lab: state.lab,
	path: focusedPath(state.nav).join("/"),
	depth: focusedDepth(state.nav),
	settled: isSettled(),
	screens: [...state.screens.values()].map((s) => ({ n: s.name, p: Math.round(s.progress * 1000) / 1000, a: s.animating ? 1 : 0, c: s.closing ? 1 : 0, d: s.dragging ? 1 : 0 })),
	errors: state.errors.length,
	frames: state.frames.length,
	counts: state.counts,
	notes: state.notes,
	latency: { push: median(latency.push), pushMax: latency.push.length ? Math.max(...latency.push) : null, pop: median(latency.pop), popMax: latency.pop.length ? Math.max(...latency.pop) : null, n: latency.push.length + latency.pop.length },
	perf: { load: perfLoad.value, frames: perf.value.frames, dropped: perf.value.dropped, late: perf.value.late, worst: Math.round(perf.value.worst * 10) / 10, vsync: Math.round(perf.value.vsync * 10) / 10 },
});

export const bridge = {
	setLab(lab: string | null) {
		state.counts = {};
		state.notes = {};
		resetPerf();
		// Screens unregister themselves on unmount; mounting effects run before the shell's, so don't clear here.
		state.lab = lab;
		if (lab === null) state.nav = null;
		changed();
	},
	setNav(nav: unknown) {
		state.nav = nav;
		changed();
	},
	report(key: string, name: string, progress: number, animating: boolean, closing: boolean, settled: boolean, dragging = false) {
		// Reports hop from the UI thread and can arrive after the screen unmounted: drop those.
		const prev = state.screens.get(key);
		if (!prev) return;
		state.screens.set(key, { key, name, progress, animating, closing, settled, dragging, mounted: prev.mounted });
		if (dragging && !prev.dragging) bridge.count(`drag:${name}`);
		changed();
	},
	frame(key: string, name: string, progress: number, t: number) {
		if (state.frames.length < 20000) state.frames.push({ t, key, name, progress });
	},
	mount(key: string, name: string) {
		const prev = state.screens.get(key);
		state.screens.set(key, prev ? { ...prev, mounted: prev.mounted + 1 } : { key, name, progress: 1, animating: false, closing: false, settled: true, dragging: false, mounted: 1 });
		changed();
	},
	/** Whether a reported screen is closing (still in the navigation state until its close ends). */
	isClosing(key: string) {
		return !!state.screens.get(key)?.closing;
	},
	unmount(key: string) {
		state.screens.delete(key);
		changed();
	},
	/** Records a named value (e.g. the state the last press asked for) for a scenario's end check. */
	note(name: string, value: string) {
		state.notes[name] = value;
		changed();
	},
	/** Counts a named event (e.g. a button press) so a scenario can check its input arrived. */
	count(name: string) {
		pressedAt[name] = Date.now();
		state.counts[name] = (state.counts[name] ?? 0) + 1;
		changed();
	},
	moved(kind: "push" | "pop", t: number) {
		const pressed = pressedAt[`bar-${kind}`];
		if (pressed && t - pressed < 1000) {
			latency[kind].push(t - pressed);
			delete pressedAt[`bar-${kind}`];
		}
	},
	error(message: string) {
		state.errors.push({ t: Date.now(), message: String(message).slice(0, 500) });
		changed();
	},
};

globalThis.__harness = {
	version: 1,
	state: () => ({
		lab: state.lab,
		nav: state.nav,
		path: focusedPath(state.nav),
		settled: isSettled(),
		screens: [...state.screens.values()],
		errors: state.errors,
	}),
	summary,
	setLevel: (level: number) => {
		bridgeLevel.value = level;
		changed();
	},
	setLoad: (ms: number) => {
		perfLoad.value = ms;
		changed();
	},
	resetPerf: (hz?: number) => {
		resetPerf(hz);
		changed();
	},
	startRecording: () => {
		state.frames = [];
		bridgeLevel.value = 2;
	},
	stopRecording: () => {
		bridgeLevel.value = 1;
		return state.frames;
	},
	reset: () => {
		state.counts = {};
		state.errors = [];
		state.frames = [];
		changed();
	},
};

// Uncaught JS errors and console.error land in the bridge (and still reach the default handler).
const previousHandler = globalThis.ErrorUtils?.getGlobalHandler?.();
globalThis.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
	bridge.error(`${isFatal ? "fatal: " : ""}${error?.message ?? error}`);
	previousHandler?.(error, isFatal);
});
const consoleError = console.error;
console.error = (...args) => {
	try {
		bridge.error(args.map((a) => (typeof a === "string" ? a : a?.message ?? JSON.stringify(a))).join(" "));
	} catch {}
	consoleError(...args);
};

/** Reports one screen's transition state; renders nothing. */
function Reporter({ routeKey, name }: { routeKey: string; name: string }) {
	const animation = useScreenAnimation();
	useEffect(() => {
		bridge.mount(routeKey, name);
		return () => bridge.unmount(routeKey);
	}, [routeKey, name]);
	// First moving frame of a push (this screen entering) or pop (this screen closing), against the
	// latest bar press: tap-to-motion latency.
	useAnimatedReaction(
		() => {
			const c = animation.value?.current;
			if (!c || !c.animating) return 0;
			if (c.closing) return c.progress < 0.999 ? 2 : 0;
			return c.progress > 0.001 && c.progress < 0.999 ? 1 : 0;
		},
		(moving, prev) => {
			if (moving && moving !== prev) scheduleOnRN(bridge.moved, moving === 1 ? "push" : "pop", Date.now());
		},
	);
	useAnimatedReaction(
		() => {
			const level = bridgeLevel.value;
			if (level === 0) return null;
			const c = animation.value?.current;
			if (!c) return null;
			// Level 1: flags, and progress rounded so a running transition doesn't report every frame.
			return [level === 2 ? c.progress : Math.round(c.progress * 10) / 10, c.animating, c.closing, c.settled, level, c.gesture.dragging];
		},
		(v, prev) => {
			if (!v) return;
			if (v[4] === 2) scheduleOnRN(bridge.frame, routeKey, name, v[0], Date.now());
			if (!prev || v[1] !== prev[1] || v[2] !== prev[2] || v[3] !== prev[3] || v[0] !== prev[0] || v[5] !== prev[5]) {
				scheduleOnRN(bridge.report, routeKey, name, v[0], !!v[1], !!v[2], !!v[3], !!v[5]);
			}
		},
		[routeKey, name],
	);
	return null;
}

/** Screens outside a transition-aware stack (plain native-stack screens) have no animation state: render nothing. */
class Quiet extends Component<{ children: React.ReactNode }, { failed: boolean }> {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	render() {
		return this.state.failed ? null : this.props.children;
	}
}

export function ScreenReporter({ routeKey, name }: { routeKey?: string; name?: string }) {
	if (!routeKey || !name) return null;
	return (
		<Quiet>
			<Reporter routeKey={routeKey} name={name} />
		</Quiet>
	);
}

/** The hidden element Argent reads in Release builds. Rendered once, by the app shell. */
export function BridgeProbe() {
	const [, setVersion] = useState(0);
	useFrameCallback((frame) => {
		"worklet";
		const load = perfLoad.value;
		if (load > 0) {
			const end = performance.now() + load;
			while (performance.now() < end) {}
		}
		const p = perf.value;
		if (p.last < 0) {
			perf.value = { ...p, last: frame.timestamp };
			return;
		}
		const dt = frame.timestamp - p.last;
		if (dt < p.vsync / 2) return;
		const missed = Math.max(0, Math.round(dt / p.vsync) - 1);
		perf.value = { frames: p.frames + 1 + missed, dropped: p.dropped + missed, late: p.late + (dt > p.vsync * 1.25 ? 1 : 0), worst: Math.max(p.worst, dt), vsync: p.vsync, last: frame.timestamp };
	});
	useEffect(() => {
		let timer = null;
		const listener = () => {
			if (timer) return;
			timer = setTimeout(() => {
				timer = null;
				setVersion(state.version);
			}, 100);
		};
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
			if (timer) clearTimeout(timer);
		};
	}, []);
	return (
		// A View, not a Text: iOS keeps a Text's first accessibility label.
		<View
			testID="harness-state"
			accessible
			accessibilityLabel={JSON.stringify(summary())}
			style={{ position: "absolute", left: 0, bottom: 0, width: 1, height: 1, opacity: 0.01 }}
			pointerEvents="none"
		/>
	);
}
