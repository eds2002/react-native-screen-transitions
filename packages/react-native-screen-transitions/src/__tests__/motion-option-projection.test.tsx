import { createModuleMock } from "./helpers/mock-module";
import { afterEach, beforeEach, expect, it, spyOn } from "bun:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { ScreenTransitionConfig } from "../types";
import type { BaseStackRoute } from "../types/stack.types";
import type { MotionAnimationState } from "../providers/motion/animation/helpers/hydrate-transition-state/types";
import type { ScreenOptionsContextValue } from "../providers/motion/options/types";
import * as helpers from "../providers/motion/options/helpers";
import { ScrollStore } from "../stores/scroll.store";

let options: ScreenTransitionConfig = {};
let route: BaseStackRoute = { key: "option-projection", name: "Detail" };
const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule("../providers/builder", () => ({
	useBuilderStore: (select: (value: any) => unknown) =>
		select({ options, descriptors: { current: { route, options } } }),
}));
const { useMotionValues } = await import(
	"../providers/motion/hooks/use-motion-values"
);
const { useMotionAnimationPipeline } = await import(
	"../providers/motion/animation/pipeline"
);
const { useScreenOptions } = await import(
	"../providers/motion/options/use-screen-options"
);
const sync = spyOn(helpers, "syncScreenOptionsBase");
let state: MotionAnimationState;
let screenOptions: ScreenOptionsContextValue;
let renderer: ReactTestRenderer | undefined;
function Probe() {
	const values = useMotionValues();
	state = useMotionAnimationPipeline(values);
	screenOptions = useScreenOptions();
	return null;
}
function render() {
	act(() => {
		if (renderer) renderer.update(<Probe />);
		else renderer = create(<Probe />);
	});
}
beforeEach(() => {
	globalThis.IS_REACT_ACT_ENVIRONMENT = true;
	options = {};
	route = { key: "option-projection", name: "Detail" };
	sync.mockClear();
});
afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
	ScrollStore.clearBag(route.key);
});

it("retains motion and base options for fresh equivalent wrappers and unrelated options", () => {
	render();
	const original = state,
		base = screenOptions.get().baseOptions,
		sharedOptions = screenOptions;
	const calls = sync.mock.calls.length;
	for (let index = 0; index < 3; index++) {
		options = { ...options, screenStyleInterpolator: () => ({}) };
		render();
		expect(state).toBe(original);
		expect(screenOptions).toBe(sharedOptions);
		expect(screenOptions.get().baseOptions).toBe(base);
	}
	expect(sync.mock.calls.length).toBe(calls);
});

const changes = {
	gestureEnabled: false,
	gestureTracking: "always",
	gestureDirection: [{ gesture: "horizontal", area: "edge" }],
	gestureSensitivity: 2,
	gestureVelocityImpact: 0.6,
	gestureSnapVelocityImpact: 0.7,
	gestureReleaseVelocityScale: 0.8,
	gestureSnapLocked: true,
	sheetSnapBehavior: "step",
	sheetScrollGestureBehavior: "collapse-only",
	backdropBehavior: "passthrough",
} satisfies ScreenTransitionConfig;

for (const key of Object.keys(changes) as (keyof typeof changes)[]) {
	it(`updates motion and runtime options when ${key} changes`, () => {
		render();
		const before = state,
			oldBase = screenOptions.get().baseOptions;
		const calls = sync.mock.calls.length;
		options = { ...options, [key]: changes[key] };
		render();
		expect(state).not.toBe(before);
		expect(state.options[key]).toEqual(changes[key]);
		expect(screenOptions.get().baseOptions).not.toBe(oldBase);
		expect(screenOptions.get()[key]).toEqual(changes[key]);
		expect(sync.mock.calls.length).toBe(calls + 1);
		const updated = state;
		options = { ...options };
		render();
		expect(state).toBe(updated);
		expect(sync.mock.calls.length).toBe(calls + 1);
	});
}

it("updates transitionSpec without replacing hydrated motion", () => {
	render();
	const before = state,
		base = screenOptions.get().baseOptions;
	options = { ...options, transitionSpec: { open: { duration: 220 } } };
	render();
	expect(state).toBe(before);
	expect(screenOptions.get().baseOptions).not.toBe(base);
	expect(screenOptions.get().transitionSpec).toBe(options.transitionSpec);
});

it("keeps route, metadata and snap changes live", () => {
	render();
	const values = state.transitionProgress;
	state.transitionProgress.set(0.45);
	let before = state;
	route = { ...route, params: { id: "updated" } };
	render();
	expect(state).not.toBe(before);
	expect(state.route.params).toEqual({ id: "updated" });
	before = state;
	options = { ...options, meta: { active: true } };
	render();
	expect(state).not.toBe(before);
	expect(state.meta).toEqual({ active: true });
	before = state;
	options = { ...options, snapPoints: [0.8, "auto", 0.3] };
	render();
	expect(state).not.toBe(before);
	expect(state.sortedNumericSnapPoints).toEqual([0.3, 0.8]);
	expect(state.hasAutoSnapPoint).toBe(true);
	expect(state.transitionProgress).toBe(values);
	expect(state.transitionProgress.get()).toBe(0.45);
});
