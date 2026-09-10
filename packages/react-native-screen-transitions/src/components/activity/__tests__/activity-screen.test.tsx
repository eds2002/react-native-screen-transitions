import { afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { useLayoutEffect, useState } from "react";
import type { SharedValue } from "react-native-reanimated";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { BuilderStoreProvider } from "../../../providers/screen/builder/builder.provider";
import { deriveDescriptorDerivations } from "../../../providers/screen/builder/helpers/derive-descriptor-derivations";
import {
	getMotionStore,
	MotionProvider,
	useMotionStore,
} from "../../../providers/screen/motion";
import {
	BlankStackStoreProvider,
	type BlankStackStoreValue,
} from "../../../providers/stack/blank-stack.provider";
import { ScrollStore } from "../../../stores/scroll.store";
import type { ScreenStyleInterpolator } from "../../../types/animation.types";
import type { BaseStackScene } from "../../../types/stack.types";
import type { InactiveBehavior } from "../helpers";
import { ActivityScreen } from "../variants/activity-screen";

mock.module("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

let useScreenAnimationPipeline: typeof import("../../../providers/screen/orchestrator/helpers/pipeline").useScreenAnimationPipeline;
let useInterpolatedStylesMap: typeof import("../../../providers/screen/orchestrator/styles/hooks/use-interpolated-style-maps").useInterpolatedStylesMap;
beforeAll(async () => {
	({ useScreenAnimationPipeline } = await import(
		"../../../providers/screen/orchestrator/helpers/pipeline"
	));
	({ useInterpolatedStylesMap } = await import(
		"../../../providers/screen/orchestrator/styles/hooks/use-interpolated-style-maps"
	));
});

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let renderer: ReactTestRenderer | undefined;
const liveScreens = new Set<string>();
const mountedStates = new Map<string, object>();
const progressByKey = new Map<string, SharedValue<number>>();
let basePipeline: ReturnType<typeof useScreenAnimationPipeline> | undefined;
let baseStyles: ReturnType<typeof useInterpolatedStylesMap> | undefined;

function BaseAnimationProbe() {
	basePipeline = useScreenAnimationPipeline();
	baseStyles = useInterpolatedStylesMap({ pipeline: basePipeline });
	return null;
}

const stackInterpolator: ScreenStyleInterpolator = ({ stackProgress }) => ({
	content: { transform: [{ translateY: stackProgress * 100 }] },
});

function ScreenProbe({ routeKey }: { routeKey: string }) {
	const state = useMotionStore((store) => store.state);
	const progress = state.transitionProgress;
	const [identity] = useState({});
	useLayoutEffect(() => {
		if (progressByKey.get(routeKey) !== progress) {
			progress.set(1);
			state.visualProgress.set(1);
			state.animationProgress.set(1);
		}
		progressByKey.set(routeKey, progress);
		mountedStates.set(routeKey, identity);
		liveScreens.add(routeKey);
		return () => {
			liveScreens.delete(routeKey);
		};
	}, [identity, progress, routeKey, state]);
	return null;
}

function stack(routeKeys: string[], inactiveBehavior?: InactiveBehavior) {
	const routes = routeKeys.map((key) => ({ key, name: "detail" }));
	const navigation = {
		getState: () => ({ routes, index: routes.length - 1, key: "stack" }),
		dispatch: () => {},
	};
	const scenes: BaseStackScene[] = routes.map((route, index) => ({
		route,
		activity:
			index === routes.length - 1
				? "active"
				: index === routes.length - 2
					? "inert"
					: "inactive",
		descriptor: {
			route,
			navigation,
			options: inactiveBehavior
				? {
						inactiveBehavior: index === 0 ? "keep" : inactiveBehavior,
						screenStyleInterpolator:
							index === 0 ? undefined : stackInterpolator,
					}
				: {},
		},
	}));
	const value: BlankStackStoreValue = {
		navigatorKey: "stack",
		routes,
		routeKeys,
		scenes,
		scenesByKey: Object.fromEntries(
			scenes.map((scene) => [scene.route.key, scene]),
		),
		paintDriverRouteKeyByRouteKey: new Map(
			routeKeys.slice(0, -2).map((key, index) => [key, routeKeys[index + 2]]),
		),
		focusedIndex: routes.length - 1,
		shouldShowFloatOverlay: false,
	};
	return (
		<BlankStackStoreProvider value={value}>
			{scenes.map((scene, index) => {
				const descriptors = {
					current: scene.descriptor,
					previous: scenes[index - 1]?.descriptor,
					next: scenes[index + 1]?.descriptor,
				};
				return (
					<ActivityScreen key={scene.route.key} routeKey={scene.route.key}>
						<BuilderStoreProvider
							storeKey={scene.route.key}
							value={{
								descriptors,
								derivations: deriveDescriptorDerivations(descriptors),
								options: scene.descriptor.options,
							}}
						>
							<MotionProvider>
								<ScreenProbe routeKey={scene.route.key} />
								{inactiveBehavior && index === 0 ? (
									<BaseAnimationProbe />
								) : null}
							</MotionProvider>
						</BuilderStoreProvider>
					</ActivityScreen>
				);
			})}
		</BlankStackStoreProvider>
	);
}

afterEach(() => {
	act(() => renderer?.unmount());
	renderer = undefined;
	for (const key of progressByKey.keys()) ScrollStore.clearBag(key);
	liveScreens.clear();
	mountedStates.clear();
	progressByKey.clear();
	basePipeline = undefined;
	baseStyles = undefined;
});

describe("ActivityScreen", () => {
	for (const behavior of ["hide", "pause", "unmount"] as const) {
		it(`keeps stack progress and the next interpolator live when older screens ${behavior}`, () => {
			const routeKeys: string[] = [];
			for (let depth = 1; depth <= 8; depth++) {
				routeKeys.push(`detail-${depth}`);
				act(() => {
					const tree = stack([...routeKeys], behavior);
					if (renderer) renderer.update(tree);
					else renderer = create(tree);
				});
				expect(basePipeline!.screenInterpolatorProps.get().stackProgress).toBe(
					depth,
				);
				if (depth > 1) {
					expect(baseStyles!.get()[0]?.content?.style?.transform).toEqual([
						{ translateY: depth * 100 },
					]);
				}
			}
			expect([...liveScreens].sort()).toEqual([
				"detail-1",
				"detail-7",
				"detail-8",
			]);
			expect(() => getMotionStore("detail-2")).toThrow();

			const top = getMotionStore("detail-8").state;
			top.visualProgress.set(0.4);
			expect(basePipeline!.screenInterpolatorProps.get().stackProgress).toBe(
				7.4,
			);
			expect(baseStyles!.get()[0]?.content?.style?.transform).toEqual([
				{ translateY: 740 },
			]);

			while (routeKeys.length > 1) {
				routeKeys.pop();
				act(() => renderer!.update(stack([...routeKeys], behavior)));
				expect(basePipeline!.screenInterpolatorProps.get().stackProgress).toBe(
					routeKeys.length,
				);
			}
			// Removed routes cannot contribute, even if an old value changes later.
			top.visualProgress.set(100);
			expect(basePipeline!.screenInterpolatorProps.get().stackProgress).toBe(1);
			expect(basePipeline!.screenInterpolatorProps.get().next).toBeUndefined();
			expect(baseStyles!.get()).toEqual([]);
		});
	}

	it("retains fractional progress until an unmounted route registers new motion values", () => {
		const routeKeys = ["a", "b", "c", "d"];
		for (let depth = 1; depth <= 2; depth++) {
			act(() => {
				const tree = stack(routeKeys.slice(0, depth), "unmount");
				if (renderer) renderer.update(tree);
				else renderer = create(tree);
			});
		}
		const oldMotion = getMotionStore("b").state;
		oldMotion.transitionProgress.set(0.6);
		oldMotion.visualProgress.set(0.6);
		for (let depth = 3; depth <= 4; depth++) {
			act(() => renderer!.update(stack(routeKeys.slice(0, depth), "unmount")));
		}
		expect(() => getMotionStore("b")).toThrow();
		expect(basePipeline!.screenInterpolatorProps.get().stackProgress).toBe(3.6);
		act(() => renderer!.update(stack(routeKeys.slice(0, 3), "unmount")));
		expect(getMotionStore("b").state.visualProgress).not.toBe(
			oldMotion.visualProgress,
		);
		oldMotion.visualProgress.set(100);
		expect(basePipeline!.screenInterpolatorProps.get().stackProgress).toBe(3);
	});

	it("keeps only the front two screens live through repeated pushes and pops", () => {
		const routeKeys: string[] = [];
		for (let depth = 1; depth <= 12; depth++) {
			routeKeys.push(`detail-${depth}`);
			act(() => {
				const tree = stack([...routeKeys]);
				if (renderer) renderer.update(tree);
				else renderer = create(tree);
			});
			expect([...liveScreens].sort()).toEqual(routeKeys.slice(-2).sort());
		}

		// Hidden Activity removes the provider's registry entry but preserves its state.
		expect(() => getMotionStore("detail-3")).toThrow();
		const initialStates = new Map(mountedStates);
		while (routeKeys.length > 1) {
			routeKeys.pop();
			act(() => renderer!.update(stack([...routeKeys])));
			expect([...liveScreens].sort()).toEqual(routeKeys.slice(-2).sort());
			for (const key of liveScreens) {
				expect(mountedStates.get(key)).toBe(initialStates.get(key));
			}
		}
	});

	it("continues reading the driver's live progress while its registry entry is paused", () => {
		const routeKeys = ["a", "b", "c", "d", "e"];
		// Push separately so every screen settles before its Activity is paused.
		for (let depth = 1; depth <= routeKeys.length; depth++) {
			act(() => {
				const tree = stack(routeKeys.slice(0, depth));
				if (renderer) renderer.update(tree);
				else renderer = create(tree);
			});
		}
		expect([...liveScreens].sort()).toEqual(["d", "e"]);
		expect(() => getMotionStore("c")).toThrow();

		act(() => {
			progressByKey.get("c")!.set(0.5);
			// The Reanimated mock samples reactions on render rather than UI frames.
			renderer!.update(stack(routeKeys));
		});
		expect(liveScreens.has("a")).toBe(true);
		expect(() => getMotionStore("c")).toThrow();

		act(() => {
			progressByKey.get("c")!.set(1);
			renderer!.update(stack(routeKeys));
		});
		expect([...liveScreens].sort()).toEqual(["d", "e"]);
	});

	it("does not reuse a settled value when the paint driver changes to an unavailable route", () => {
		const routeKeys = ["a", "b", "c", "d", "e"];
		for (let depth = 1; depth <= routeKeys.length; depth++) {
			act(() => {
				const tree = stack(routeKeys.slice(0, depth));
				if (renderer) renderer.update(tree);
				else renderer = create(tree);
			});
		}
		expect([...liveScreens].sort()).toEqual(["d", "e"]);

		// A route inserted behind the front two starts paused without registering.
		routeKeys[2] = "replacement";
		act(() => renderer!.update(stack(routeKeys)));
		expect(() => getMotionStore("replacement")).toThrow();
		expect(liveScreens.has("a")).toBe(true);

		act(() => renderer!.update(stack(routeKeys.slice(0, 3))));
		expect([...liveScreens].sort()).toEqual(["b", "replacement"]);
	});
});
