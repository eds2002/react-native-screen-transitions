import { createModuleMock } from "./helpers/mock-module";
import { afterEach, expect, it } from "bun:test";
import { memo, useSyncExternalStore } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { ScreenTransitionConfig } from "../types";

let options: ScreenTransitionConfig = {};
let route = { key: "subscriptions", name: "Detail" };
let first = false;
const listeners = new Set<() => void>();
let snapshot: any;
function publish() {
	snapshot = {
		options,
		descriptors: { current: { route, options } },
		derivations: { isFirstKey: first },
	};
	for (const listener of listeners) listener();
}
const subscribe = (listener: () => void) => {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
};
const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule("../providers/builder", () => ({
	useBuilderStore: (select: (store: any) => unknown) =>
		useSyncExternalStore(subscribe, () => select(snapshot)),
}));
const { useMotionAnimationPipeline } = await import(
	"../providers/motion/animation/pipeline"
);
const { useScreenOptions } = await import(
	"../providers/motion/options/use-screen-options"
);
const { useScreenGestureConfig } = await import(
	"../providers/motion/gestures/ownership/hooks/use-screen-gesture-config"
);
const { mountMotionValues } = await import("./helpers/mount-motion-values");
let renderer: ReactTestRenderer | undefined;
afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
	options = {};
	first = false;
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

it("preserves projected output identities and observes every consumed field", () => {
	const values = mountMotionValues();
	let animation: any;
	let runtimeOptions: any;
	let gestures: any;
	const snapshotOutputs = () => [
		animation,
		runtimeOptions.get().baseOptions,
		gestures,
	];
	const Animation = memo(function Animation() {
		animation = useMotionAnimationPipeline(values);
		return null;
	});
	const Options = memo(function Options() {
		runtimeOptions = useScreenOptions();
		return null;
	});
	const Gestures = memo(function Gestures() {
		gestures = useScreenGestureConfig();
		return null;
	});
	publish();
	act(() => {
		renderer = create(
			<>
				<Animation />
				<Options />
				<Gestures />
			</>,
		);
	});
	const initial = snapshotOutputs();
	for (let i = 0; i < 3; i++) {
		act(() => {
			options = { ...options, screenStyleInterpolator: () => ({}) };
			publish();
		});
	}
	snapshotOutputs().forEach((value, index) =>
		expect(value).toBe(initial[index]),
	);
	const changes = {
		gestureEnabled: false,
		gestureTracking: "always",
		gestureDirection: "horizontal",
		gestureSensitivity: 2,
		gestureVelocityImpact: 0.6,
		gestureSnapVelocityImpact: 0.7,
		gestureReleaseVelocityScale: 0.8,
		gestureSnapLocked: true,
		sheetSnapBehavior: "step",
		sheetScrollGestureBehavior: "collapse-only",
		backdropBehavior: "passthrough",
		transitionSpec: {
			open: { animation: "timing", config: { duration: 200 } },
		},
		snapPoints: [0.5, 1],
		meta: { changed: true },
	} as ScreenTransitionConfig;
	for (const [key, value] of Object.entries(changes)) {
		const before = snapshotOutputs();
		act(() => {
			options = { ...options, [key]: value };
			publish();
		});
		const expected = [
			key !== "transitionSpec",
			!["meta", "snapPoints"].includes(key),
			!["meta", "backdropBehavior"].includes(key),
		];
		for (let index = 0; index < 3; index++) {
			expect(snapshotOutputs()[index] !== before[index]).toBe(expected[index]);
		}
	}
	let before = snapshotOutputs();
	act(() => {
		route = { ...route, name: "Changed" };
		publish();
	});
	expect(
		snapshotOutputs().map((value, index) => value !== before[index]),
	).toEqual([true, false, false]);
	before = snapshotOutputs();
	act(() => {
		first = true;
		publish();
	});
	expect(
		snapshotOutputs().map((value, index) => value !== before[index]),
	).toEqual([false, false, true]);
	const settled = snapshotOutputs();
	act(() => {
		options = { ...options };
		publish();
	});
	snapshotOutputs().forEach((value, index) =>
		expect(value).toBe(settled[index]),
	);
});
