import { createModuleMock } from "./helpers/mock-module";
import { afterEach, expect, it } from "bun:test";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import type { SharedValue } from "react-native-reanimated";
import type { MotionAnimationState } from "../providers/motion/animation/helpers/hydrate-transition-state/types";
import type { ScreenAnimationPipeline } from "../providers/orchestrator/helpers/pipeline";
import { mountMotionValues } from "./helpers/mount-motion-values";

let dimensions = { width: 400, height: 800, scale: 1, fontScale: 1 };
let insets = { top: 20, bottom: 10, left: 0, right: 0 };
let descriptors: { current: any; next?: any; previous?: any };
let motions: Record<string, MotionAnimationState> = {};
let routeKeys: string[] = [];
let current: MotionAnimationState | null = null;
const native = await import("react-native");
const mockModule = createModuleMock((specifier) => import.meta.resolve(specifier));
await mockModule("react-native", () => ({
	...native,
	useWindowDimensions: () => dimensions,
}));
await mockModule("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => insets,
}));
await mockModule("../providers/builder", () => ({
	useBuilderStore: (select: (store: any) => any) => select({ descriptors }),
}));
await mockModule("../navigators/blank-stack/state/blank-stack.provider", () => ({
	useOptionalBlankStackStore: (select: (store: any) => any) =>
		select({ routeKeys }),
}));
await mockModule("../providers/motion", () => ({
	useMotionStore: (
		keysOrSelector: string[] | ((store: any) => any),
		select = (store: any) => store,
	) =>
		Array.isArray(keysOrSelector)
			? keysOrSelector.map((key) =>
					motions[key] ? select({ state: motions[key] }) : null,
				)
			: keysOrSelector({ state: current }),
	useOptionalMotionStore: (key: string | null, select: (store: any) => any) =>
		key && motions[key] ? select({ state: motions[key] }) : null,
}));
// This fixture tests frame hydration, while listener lifecycle has its own
// real hook tests. Keep its minimal shared-value mocks out of listener setup.
await mockModule(
	"../providers/orchestrator/helpers/use-stack-progress-inputs",
	() => ({
		useStackProgressInputs: (currentRouteKey: string) => ({
			entries: {
				get: () => {
					const index = routeKeys.lastIndexOf(currentRouteKey);
					return (index < 0 ? [] : routeKeys.slice(index)).flatMap(
						(routeKey) =>
							motions[routeKey]
								? [
										{
											routeKey,
											visualProgress: motions[routeKey].visualProgress,
										},
									]
								: [],
					);
				},
			},
			revision: { get: () => 0 },
		}),
	}),
);
const { useScreenAnimationPipeline } = await import(
	"../providers/orchestrator/helpers/pipeline"
);
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const renderers: ReactTestRenderer[] = [];
afterEach(() => {
	act(() => {
		for (const renderer of renderers.splice(0)) renderer.unmount();
	});
});
function shared<T>(value: T) {
	return {
		get: () => value,
		set: (next: T) => {
			value = next;
		},
	} as SharedValue<T>;
}
function motion(key: string): MotionAnimationState {
	return {
		...mountMotionValues(),
		route: { key, name: "Detail" },
		options: { gestureEnabled: true, gestureDirection: "vertical" },
		meta: { key },
		hasAutoSnapPoint: false,
		sortedNumericSnapPoints: [],
		scrollMetadata: shared(null),
	};
}
const descriptor = (state: MotionAnimationState) => ({
	route: state.route,
	options: { ...state.options, meta: state.meta },
	navigation: {},
});
const snapshot = (pipeline: ScreenAnimationPipeline) =>
	JSON.parse(JSON.stringify(pipeline.screenInterpolatorProps.get()));

it("matches fresh seeds across live route, option, dimensions and missing-store changes", () => {
	const a = motion("A"),
		b = motion("B"),
		c = motion("C");
	a.transitionProgress.set(0.6);
	b.transitionProgress.set(0.3);
	c.transitionProgress.set(0.1);
	a.visualProgress.set(0.6);
	b.visualProgress.set(0.3);
	c.visualProgress.set(0.1);
	current = a;
	motions = { A: a };
	routeKeys = ["A"];
	descriptors = { current: descriptor(a) };
	let stable: ScreenAnimationPipeline, fresh: ScreenAnimationPipeline;
	function Stable() {
		stable = useScreenAnimationPipeline();
		return null;
	}
	function Fresh() {
		fresh = useScreenAnimationPipeline();
		return null;
	}
	let stableRenderer: ReactTestRenderer;
	act(() => {
		stableRenderer = create(<Stable />);
		renderers.push(stableRenderer);
	});
	let freshRenderer: ReactTestRenderer | undefined;
	let version = 0;
	const verify = () => {
		act(() => {
			stableRenderer.update(<Stable />);
			if (freshRenderer) freshRenderer.update(<Fresh key={++version} />);
			else {
				freshRenderer = create(<Fresh key={version} />);
				renderers.push(freshRenderer);
			}
		});
		const actual = snapshot(stable!);
		expect(actual).toEqual(snapshot(fresh!));
		return actual;
	};
	expect(verify().current.progress).toBe(0.6);
	descriptors = { current: descriptor(a), next: descriptor(b) };
	routeKeys = ["A", "B", "C"];
	motions = { A: a, B: b, C: c };
	let frame = verify();
	expect(frame.next.route.key).toBe("B");
	expect(frame.focused).toBe(false);
	expect(frame.stackProgress).toBeCloseTo(1);
	dimensions = { width: 800, height: 400, scale: 2, fontScale: 1.2 };
	insets = { top: 0, bottom: 0, left: 25, right: 25 };
	a.measuredContentLayout.set({ width: 500, height: 230 });
	frame = verify();
	expect(frame.layouts.screen).toEqual({ width: 800, height: 400 });
	expect(frame.insets).toEqual(insets);
	// A descriptor can exist before its keyed Motion store registers.
	delete motions.B;
	expect(verify().next).toBeUndefined();
	motions.B = b;
	expect(verify().next.route.key).toBe("B");
	current = b;
	descriptors = {
		current: descriptor(b),
		previous: descriptor(a),
		next: descriptor(c),
	};
	expect(verify().current.route.key).toBe("B");
	current = {
		...b,
		route: { ...b.route, params: { id: "updated" } },
		options: { gestureEnabled: false, gestureDirection: "horizontal" },
		meta: { changed: true },
		sortedNumericSnapPoints: [0.25, 0.75],
		hasAutoSnapPoint: true,
	};
	current.resolvedAutoSnapPoint.set(0.5);
	current.targetProgress.set(0.75);
	current.normX.set(0.2);
	motions.B = current;
	descriptors = { current: descriptor(current), previous: descriptor(a) };
	frame = verify();
	expect(frame.current.route.params).toEqual({ id: "updated" });
	expect(frame.current.options.gestureEnabled).toBe(false);
	expect(frame.current.meta).toEqual({ changed: true });
	expect(frame.current.snapIndex).toBe(2);
	current = null;
	frame = verify();
	expect(frame.current.route).toEqual({});
	expect(frame.next).toBeUndefined();
	current = c;
	descriptors = { current: descriptor(c) };
	motions = { C: c };
	routeKeys = ["C"];
	frame = verify();
	expect(frame.current.route.key).toBe("C");
	expect(frame.previous).toBeUndefined();
	expect(frame.focused).toBe(true);
});
