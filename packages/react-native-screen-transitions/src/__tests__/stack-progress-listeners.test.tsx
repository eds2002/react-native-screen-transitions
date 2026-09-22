import { createModuleMock } from "./helpers/mock-module";
import { afterEach, expect, it } from "bun:test";
import { Activity, useState } from "react";
import * as reanimated from "react-native-reanimated";
import * as worklets from "react-native-worklets";
import type { SharedValue } from "react-native-reanimated";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import {
	readStackProgress,
	type StackProgressEntry,
} from "../providers/orchestrator/helpers/stack-progress";

function mutable<T>(initial: T) {
	let value = initial;
	const listeners = new Map<number, (value: T) => void>();
	return {
		listeners,
		get value() {
			return value;
		},
		set value(next: T) {
			this.set(next);
		},
		get: () => value,
		set(next: T | ((value: T) => T)) {
			const resolved =
				typeof next === "function" ? (next as (value: T) => T)(value) : next;
			if (Object.is(value, resolved)) return;
			value = resolved;
			listeners.forEach((listener) => listener(value));
		},
		addListener(id: number, callback: (value: T) => void) {
			listeners.set(id, callback);
		},
		removeListener(id: number) {
			listeners.delete(id);
		},
		modify(callback: (value: T) => T) {
			this.set(callback(value));
		},
	};
}
const reanimatedExports = { ...reanimated },
	workletExports = { ...worklets };
const jobs: (() => void)[] = [];
const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule("react-native-reanimated", () => ({
	...reanimatedExports,
	makeMutable: mutable,
	useSharedValue: <T,>(value: T) => useState(() => mutable(value))[0],
}));
await mockModule("react-native-worklets", () => ({
	...workletExports,
	scheduleOnUI: (fn: (...args: any[]) => void, ...args: any[]) =>
		jobs.push(() => fn(...args)),
}));
let hookEntries: readonly StackProgressEntry[] = [];
await mockModule("../navigators/blank-stack/state/blank-stack.provider", () => ({
	useOptionalBlankStackStore: (select: (store: any) => unknown) =>
		select({ routeKeys: hookEntries.map((entry) => entry.routeKey) }),
}));
await mockModule("../providers/motion", () => ({
	useMotionStore: (keys: readonly string[], select: (store: any) => unknown) =>
		keys.map((key) => {
			const entry = hookEntries.find((entry) => entry.routeKey === key);
			return entry
				? select({ state: { visualProgress: entry.visualProgress } })
				: null;
		}),
}));
const {
	registerStackProgressInputs,
	unregisterStackProgressInputs,
	useStackProgressInputs,
} = await import(
	"../providers/orchestrator/helpers/use-stack-progress-inputs"
);
const flush = () => {
	while (jobs.length) jobs.shift()!();
};
let renderer: ReactTestRenderer | undefined;
afterEach(() => {
	act(() => renderer?.unmount());
	flush();
	renderer = undefined;
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

it("invalidates synchronously and preserves live suffix, topology and stale-job safety", () => {
	const a = mutable(1),
		b = mutable(0.4),
		c = mutable(0.2);
	const initial = [
		{ routeKey: "A", visualProgress: a },
		{ routeKey: "B", visualProgress: b },
	] as StackProgressEntry[];
	const inputs = {
		entries: mutable<readonly StackProgressEntry[]>(initial),
		revision: mutable(0),
		epoch: mutable(0),
	};
	registerStackProgressInputs(inputs as any, initial, -100, 1);
	const before = inputs.revision.get();
	b.set(0.7);
	expect(inputs.revision.get()).toBe(before + 1);
	expect(readStackProgress(inputs.entries.get(), "A", 99)).toBe(1.7);
	const next = [
		{ routeKey: "C", visualProgress: c },
		{ routeKey: "B", visualProgress: b },
	] as StackProgressEntry[];
	registerStackProgressInputs(inputs as any, next, -100, 2);
	expect(a.listeners.size).toBe(0);
	expect(b.listeners.size).toBe(1);
	expect(c.listeners.size).toBe(1);
	unregisterStackProgressInputs(inputs as any, -100, 1);
	expect(c.listeners.size).toBe(1);
	registerStackProgressInputs(inputs as any, initial, -100, 1);
	expect(inputs.entries.get()).toBe(next);
	expect(readStackProgress(inputs.entries.get(), "A", 99)).toBe(99);
	expect(readStackProgress(inputs.entries.get(), "C", 99)).toBeCloseTo(0.9);
	unregisterStackProgressInputs(inputs as any, -100, 2);
	const stopped = inputs.revision.get();
	c.set(0.6);
	expect(inputs.revision.get()).toBe(stopped);
	registerStackProgressInputs(inputs as any, next, -100, 2);
	expect(c.listeners.size).toBe(0);
	registerStackProgressInputs(inputs as any, next, -100, 3);
	expect(c.listeners.size).toBe(1);
	expect(readStackProgress(inputs.entries.get(), "C", 99)).toBeCloseTo(1.3);
});

it("keeps mapper inputs stable and listener IDs isolated through Activity cleanup/resume", () => {
	const value = mutable(0.2);
	let entries = [
		{ routeKey: "A", visualProgress: value },
	] as StackProgressEntry[];
	let outputs: ReturnType<typeof useStackProgressInputs>[] = [];
	function Probe() {
		hookEntries = entries;
		outputs = [useStackProgressInputs("A"), useStackProgressInputs("A")];
		return null;
	}
	const update = (mode: "visible" | "hidden") =>
		act(() => {
			const tree = (
				<Activity mode={mode}>
					<Probe />
				</Activity>
			);
			if (renderer) renderer.update(tree);
			else renderer = create(tree);
		});
	update("visible");
	expect(value.listeners.size).toBe(0);
	flush();
	expect(value.listeners.size).toBe(2);
	const ids = [...value.listeners.keys()];
	expect(ids.every((id) => id < 0)).toBe(true);
	expect(new Set(ids).size).toBe(2);
	const first = outputs[0];
	entries = [...entries];
	update("visible");
	flush();
	expect(outputs[0].entries).toBe(first.entries);
	expect(outputs[0].revision).toBe(first.revision);
	expect(value.listeners.size).toBe(2);
	update("hidden");
	flush();
	expect(value.listeners.size).toBe(0);
	const revision = first.revision.get();
	value.set(0.8);
	expect(first.revision.get()).toBe(revision);
	update("visible");
	flush();
	expect(value.listeners.size).toBe(2);
	expect([...value.listeners.keys()]).toEqual(ids);
	expect(readStackProgress(first.entries.get(), "A", 99)).toBe(0.8);
	act(() => renderer!.unmount());
	renderer = undefined;
	flush();
	expect(value.listeners.size).toBe(0);
});

it("real hydration writes are visible before the registered reader returns its suffix", async () => {
	const { mountMotionValues } = await import("./helpers/mount-motion-values");
	const { useInterpolatorState } = await import(
		"../providers/orchestrator/helpers/use-interpolator-state"
	);
	const { hydrateTransitionState } = await import(
		"../providers/motion/animation/helpers/hydrate-transition-state"
	);
	const { DEFAULT_SCREEN_TRANSITION_OPTIONS } = await import("../constants");
	const values = mountMotionValues();
	const motion = {
		...values,
		route: { key: "live", name: "Live" },
		options: DEFAULT_SCREEN_TRANSITION_OPTIONS,
		meta: {},
		hasAutoSnapPoint: false,
		sortedNumericSnapPoints: [],
		scrollMetadata: mutable(null) as any,
	};
	let built: ReturnType<typeof useInterpolatorState>;
	let inputs: ReturnType<typeof useStackProgressInputs>;
	function Probe() {
		built = useInterpolatorState(motion);
		hookEntries = [{ routeKey: "live", visualProgress: values.visualProgress }];
		inputs = useStackProgressInputs("live");
		return null;
	}
	act(() => {
		renderer = create(<Probe />);
	});
	flush();
	const revision = inputs!.revision.get();
	values.transitionProgress.set(0.65);
	hydrateTransitionState(built!, { width: 400, height: 800 });
	expect(inputs!.revision.get()).toBe(revision + 1);
	expect(readStackProgress(inputs!.entries.get(), "live", 99)).toBe(0.65);
	hydrateTransitionState(built!, { width: 400, height: 800 });
	expect(inputs!.revision.get()).toBe(revision + 1);
});

it("tombstones cleanup that arrives before setup without touching newer registrations", () => {
	const value = mutable(0.5);
	const entries = [
		{ routeKey: "A", visualProgress: value },
	] as StackProgressEntry[];
	const inputs = {
		entries: mutable<readonly StackProgressEntry[]>(entries),
		revision: mutable(0),
		epoch: mutable(0),
	};
	unregisterStackProgressInputs(inputs as any, -200, 1);
	registerStackProgressInputs(inputs as any, entries, -200, 1);
	expect(value.listeners.size).toBe(0);
	expect(inputs.epoch.get()).toBe(-1);
	registerStackProgressInputs(inputs as any, entries, -200, 2);
	expect(value.listeners.size).toBe(1);
	unregisterStackProgressInputs(inputs as any, -200, 1);
	expect(value.listeners.size).toBe(1);
	unregisterStackProgressInputs(inputs as any, -200, 3);
	expect(value.listeners.size).toBe(0);
	registerStackProgressInputs(inputs as any, entries, -200, 3);
	expect(value.listeners.size).toBe(0);
});
