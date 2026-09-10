import { afterEach, describe, expect, it } from "bun:test";
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
import type { BaseStackScene } from "../../../types/stack.types";
import { ActivityScreen } from "../variants/activity-screen";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let renderer: ReactTestRenderer | undefined;
const liveScreens = new Set<string>();
const mountedStates = new Map<string, object>();
const progressByKey = new Map<string, SharedValue<number>>();

function ScreenProbe({ routeKey }: { routeKey: string }) {
	const progress = useMotionStore((store) => store.state.transitionProgress);
	const [identity] = useState({});
	useLayoutEffect(() => {
		if (!progressByKey.has(routeKey)) progress.set(1);
		progressByKey.set(routeKey, progress);
		mountedStates.set(routeKey, identity);
		liveScreens.add(routeKey);
		return () => {
			liveScreens.delete(routeKey);
		};
	}, [identity, progress, routeKey]);
	return null;
}

function stack(routeKeys: string[]) {
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
		descriptor: { route, navigation, options: {} },
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
});

describe("ActivityScreen", () => {
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
