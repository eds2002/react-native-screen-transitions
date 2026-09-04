import { beforeEach, describe, expect, it } from "bun:test";
import type { ReactNode } from "react";
import { act, create, type ReactTestRenderer } from "react-test-renderer";
import { BlankStackStoreProvider } from "../providers/stack/blank-stack.provider";
import { AnimationStore } from "../stores/animation.store";
import { SystemStore } from "../stores/system.store";
import type { BlankStackNavigationOptions } from "../types/blank-stack.types";
import type { BlankStackStoreValue } from "../types/providers/blank-stack-provider.types";
import type {
	BaseStackDescriptor,
	BaseStackScene,
} from "../types/stack.types";
import {
	StackTransitionProvider,
	type StackTransition,
	useStackTransition,
} from "../providers/stack/stack-transition";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const scene = (
	key: string,
	activity: BaseStackScene["activity"],
	previousKey?: string,
	options: BlankStackNavigationOptions = {},
): BaseStackScene => {
	const route = { key, name: key };
	const createDescriptor = (routeKey: string): BaseStackDescriptor => ({
		navigation: {
			dispatch: () => {},
			getState: () => ({ index: 0, key: "stack", routes: [] }),
		},
		options: routeKey === key ? options : {},
		route: { key: routeKey, name: routeKey },
	});

	return {
		activity,
		descriptor: createDescriptor(key),
		previousDescriptor: previousKey
			? createDescriptor(previousKey)
			: undefined,
		route,
	};
};

const stackValue = (
	scenes: BaseStackScene[],
	focusedIndex: number,
): BlankStackStoreValue => ({
	focusedIndex,
	handleCloseRoute: undefined,
	navigatorKey: "stack",
	paintDriverRouteKeyByRouteKey: new Map(),
	requestDismiss: undefined,
	routeKeys: scenes.map(({ route }) => route.key),
	routes: scenes.map(({ route }) => route),
	scenes,
	scenesByKey: Object.fromEntries(
		scenes.map((currentScene) => [currentScene.route.key, currentScene]),
	),
	shouldShowFloatOverlay: false,
});

const renderRuntime = (value: BlankStackStoreValue, children: ReactNode) => (
	<BlankStackStoreProvider value={value}>
		<StackTransitionProvider>{children}</StackTransitionProvider>
	</BlankStackStoreProvider>
);

describe("useStackTransition", () => {
	beforeEach(() => {
		(globalThis as any).resetMutableRegistry();
	});

	it("exposes a blocked push at progress zero before the driver activates", () => {
		let observed: StackTransition | null = null;
		let renderer: ReactTestRenderer;
		const routeA = scene("A", "active");
		const routeB = scene("B", "active", "A");

		function Reader() {
			observed = useStackTransition();
			return null;
		}

		act(() => {
			renderer = create(renderRuntime(stackValue([routeA], 0), <Reader />));
		});
		expect(observed).toBeNull();

		act(() => {
			renderer.update(
				renderRuntime(
					stackValue([scene("A", "inert"), routeB], 1),
					<Reader />,
				),
			);
		});

		expect(observed?.source.route.key).toBe("A");
		expect(observed?.target.route.key).toBe("B");
		expect(observed?.driver.route.key).toBe("B");
		expect(observed?.direction).toBe("forward");
		expect(observed?.progress.get()).toBe(0);

		act(() => renderer.unmount());
	});

	it("reads pop progress directly from the retained driver's value", () => {
		let observed: StackTransition | null = null;
		let renderer: ReactTestRenderer;
		const routeA = scene("A", "inert");
		const routeB = scene("B", "active", "A");
		const driverProgress = AnimationStore.getValue("B", "visualProgress");
		driverProgress.set(1);

		function Reader() {
			observed = useStackTransition();
			return null;
		}

		act(() => {
			renderer = create(
				renderRuntime(stackValue([routeA, routeB], 1), <Reader />),
			);
		});

		act(() => {
			renderer.update(
				renderRuntime(
					stackValue(
						[
							scene("A", "inert"),
							scene("B", "closing", "A"),
						],
						0,
					),
					<Reader />,
				),
			);
		});

		expect(observed?.direction).toBe("backward");
		expect(observed?.source.route.key).toBe("B");
		expect(observed?.target.route.key).toBe("A");
		expect(observed?.progress.get()).toBe(0);

		driverProgress.set(0.4);

		expect(observed?.progress.get()).toBeCloseTo(0.6);
		act(() => renderer.unmount());
	});

	it("normalizes a partial-height screen into full navigator progress", () => {
		let observed: StackTransition | null = null;
		let renderer: ReactTestRenderer;
		const routeA = scene("A", "active");
		const routeB = scene("B", "active", "A", {
			snapPoints: [0.6, 1],
		});
		const driverProgress = AnimationStore.getValue("B", "visualProgress");
		driverProgress.set(0);

		function Reader() {
			observed = useStackTransition();
			return null;
		}

		act(() => {
			renderer = create(renderRuntime(stackValue([routeA], 0), <Reader />));
		});
		act(() => {
			renderer.update(
				renderRuntime(
					stackValue([scene("A", "inert"), routeB], 1),
					<Reader />,
				),
			);
		});

		driverProgress.set(0.3);
		expect(observed?.progress.get()).toBeCloseTo(0.5);

		driverProgress.set(0.6);
		expect(observed?.progress.get()).toBe(1);

		driverProgress.set(1);
		expect(observed?.progress.get()).toBe(1);

		SystemStore.clearBag("B");
		act(() => renderer.unmount());
	});
});
