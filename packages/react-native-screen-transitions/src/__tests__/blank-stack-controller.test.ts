import { beforeEach, describe, expect, it } from "bun:test";
import type { BlankStackProviderProps } from "../types/providers/blank-stack-provider.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackRoute,
} from "../types/stack.types";

const { createBlankStackController } = await import(
	"../navigators/kit/state/blank-stack-controller"
);

const CHILD_STATE = Symbol("CHILD_STATE");

const createRoute = (key: string): BaseStackRoute => ({ key, name: key });

const setRouteChildState = (route: BaseStackRoute, state: unknown) => {
	Object.defineProperty(route, CHILD_STATE, {
		configurable: true,
		enumerable: false,
		value: state,
	});
};

const createNavigation = (): BaseStackNavigation & { actions: any[] } => {
	const actions: any[] = [];
	return {
		actions,
		getState: () => ({ key: "stack", index: 0, routes: [] }),
		dispatch: (action: any) => {
			actions.push(action);
		},
	};
};

const createDescriptor = (
	route: BaseStackRoute,
	navigation: BaseStackNavigation,
	options: BaseStackDescriptor["options"] = {} as BaseStackDescriptor["options"],
): BaseStackDescriptor => ({
	route,
	navigation,
	options,
});

const createProps = (
	routes: BaseStackRoute[],
	descriptors: Record<string, BaseStackDescriptor>,
	navigation: BaseStackNavigation,
): BlankStackProviderProps => ({
	state: {
		key: "stack",
		index: routes.length - 1,
		routes,
	},
	navigation,
	descriptors,
});

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("createBlankStackController", () => {
  it("keeps a closing screen under a screen pushed before its close finishes", () => {
    const navigation = createNavigation();
    const a = createRoute("a");
    const b = createRoute("b");
    const b2 = createRoute("b2");
    const descriptors = { a: createDescriptor(a, navigation), b: createDescriptor(b, navigation), b2: createDescriptor(b2, navigation) };
    const controller = createBlankStackController(createProps([a, b], { a: descriptors.a, b: descriptors.b }, navigation));
    // Pop b: it stays mounted while it animates out.
    controller.update(createProps([a], { a: descriptors.a }, navigation));
    expect(controller.getSnapshot().state.routeKeys).toEqual(["a", "b"]);
    // Push b2 before b's close finishes: b keeps closing in its slot, under b2.
    controller.update(createProps([a, b2], { a: descriptors.a, b2: descriptors.b2 }, navigation));
    expect(controller.getSnapshot().state.routeKeys).toEqual(["a", "b", "b2"]);
    expect(controller.getSnapshot().state.closingRouteKeys.has("b")).toBe(true);
    // When b's close finishes it is removed.
    controller.handleCloseRoute({ route: b });
    expect(controller.getSnapshot().state.routeKeys).toEqual(["a", "b2"]);
    expect(navigation.actions).toEqual([]);
  });
  it("retains the newly dismissed screen when a gesture-closing screen is removed in the same update", () => {
    const navigation = createNavigation();
    const a = createRoute("a");
    const b = createRoute("b");
    const c = createRoute("c");
    const descriptors = { a: createDescriptor(a, navigation), b: createDescriptor(b, navigation), c: createDescriptor(c, navigation) };
    const controller = createBlankStackController(createProps([a, b, c], descriptors, navigation));
    controller.requestDismiss({ route: c });
    controller.update(createProps([a], { a: descriptors.a }, navigation));
    expect(controller.getSnapshot().state.routeKeys).toEqual(["a", "b"]);
    expect(controller.getSnapshot().state.closingRouteKeys.has("b")).toBe(true);
    expect(controller.getSnapshot().state.scenes.find(scene => scene.route.key === "b")?.activity).toBe("closing");
    controller.handleCloseRoute({ route: b });
    expect(controller.getSnapshot().state.routeKeys).toEqual(["a"]);
    expect(navigation.actions).toEqual([]);
  });

	it("keeps B under C during replacement, then reveals A when C is dismissed", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const routeC = createRoute("c");
		const descriptorA = createDescriptor(routeA, navigation);
		const descriptorB = createDescriptor(routeB, navigation);
		const descriptorC = createDescriptor(routeC, navigation);
		const controller = createBlankStackController(
			createProps([routeA], { a: descriptorA }, navigation),
		);

		controller.update(
			createProps([routeA, routeB], { a: descriptorA, b: descriptorB }, navigation),
		);
		const replacedProps = createProps(
			[routeA, routeC],
			{ a: descriptorA, c: descriptorC },
			navigation,
		);
		controller.update(replacedProps);

		const replacing = controller.getSnapshot().state;
		expect(
			replacing.scenes.find((scene) => scene.route.key === "c")
				?.previousDescriptor?.route,
		).toBe(routeB);
		expect(
			replacing.scenes.find((scene) => scene.route.key === "b")?.activity,
		).toBe("inert");

		// A parent render must not lose the pending replacement cleanup.
		controller.update(replacedProps);
		expect(controller.getSnapshot().state.routeKeys).toEqual(["a", "b", "c"]);
		controller.handleOpenRoute({ route: routeA });
		expect(controller.getSnapshot().state.routeKeys).toEqual(["a", "b", "c"]);
		controller.handleOpenRoute({ route: routeC });
		const settled = controller.getSnapshot().state;
		expect(settled.routeKeys).toEqual(["a", "c"]);
		expect(settled.descriptors.b).toBeUndefined();
		expect(settled.closingRouteKeys.size).toBe(0);
		expect(navigation.actions).toEqual([]);

		expect(controller.requestDismiss({ route: routeC })).toBe(true);
		const dismissing = controller.getSnapshot().state;
		expect(
			dismissing.scenes.find((scene) => scene.route.key === "c")
				?.previousDescriptor?.route,
		).toBe(routeA);
		expect(dismissing.scenes.map((scene) => scene.activity)).toEqual([
			"inert",
			"closing",
		]);
		controller.handleCloseRoute({ route: routeC });
		expect(navigation.actions).toEqual([
			{ type: "POP", payload: { count: 1 }, source: "c", target: "stack" },
		]);
		controller.update(createProps([routeA], { a: descriptorA }, navigation));
		expect(controller.getSnapshot().state.routeKeys).toEqual(["a"]);
	});

	it("retains a removed focused route with its previous descriptor synchronously", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const routeC = createRoute("c");
		const descriptorA = createDescriptor(routeA, navigation);
		const descriptorB = createDescriptor(routeB, navigation);
		const descriptorC = createDescriptor(routeC, navigation);

		const controller = createBlankStackController(
			createProps(
				[routeA, routeB, routeC],
				{ a: descriptorA, b: descriptorB, c: descriptorC },
				navigation,
			),
		);
		const previousDescriptor = controller.getSnapshot().state.descriptors.c;

		controller.update(
			createProps([routeA, routeB], { a: descriptorA, b: descriptorB }, navigation),
		);

		const snapshot = controller.getSnapshot();
		expect(snapshot.state.routes.map((route) => route.key)).toEqual([
			"a",
			"b",
			"c",
		]);
		expect(snapshot.state.descriptors.c?.route).toBe(descriptorC.route);
		expect(snapshot.state.descriptors.c).toBe(previousDescriptor);
		expect(snapshot.state.closingRouteKeys.has("c")).toBe(true);
		expect(snapshot.state.scenes[0]?.previousDescriptor).toBeUndefined();
		expect(snapshot.state.scenes[0]?.nextDescriptor?.route).toBe(
			descriptorB.route,
		);
		expect(snapshot.state.scenes[1]?.previousDescriptor?.route).toBe(
			descriptorA.route,
		);
		expect(snapshot.state.scenes[1]?.nextDescriptor?.route).toBe(
			descriptorC.route,
		);
		expect(snapshot.state.scenes.map((scene) => scene.activity)).toEqual([
			"inactive",
			"inert",
			"closing",
		]);
	});

	it("soft-dismisses a focused route before React Navigation removes it", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const descriptorA = createDescriptor(routeA, navigation);
		const descriptorB = createDescriptor(routeB, navigation);
		const controller = createBlankStackController(
			createProps(
				[routeA, routeB],
				{ a: descriptorA, b: descriptorB },
				navigation,
			),
		);

		expect(controller.requestDismiss({ route: routeB })).toBe(true);

		const snapshot = controller.getSnapshot();
		expect(snapshot.state.routes.map((route) => route.key)).toEqual(["a", "b"]);
		expect(snapshot.state.closingRouteKeys.has("b")).toBe(true);
		expect(snapshot.state.scenes.map((scene) => scene.activity)).toEqual([
			"inert",
			"closing",
		]);
		expect(navigation.actions).toEqual([]);
	});

	it("keeps active and inert calculations independent of closing routes", () => {
		const navigation = createNavigation();
		const routeIndex = createRoute("index");
		const routeA = createRoute("dynamic-a");
		const routeB = createRoute("dynamic-b");
		const descriptorIndex = createDescriptor(routeIndex, navigation);
		const descriptorA = createDescriptor(routeA, navigation);
		const descriptorB = createDescriptor(routeB, navigation);
		const controller = createBlankStackController(
			createProps(
				[routeIndex, routeA],
				{
					index: descriptorIndex,
					"dynamic-a": descriptorA,
				},
				navigation,
			),
		);

		expect(controller.requestDismiss({ route: routeA })).toBe(true);

		controller.update(
			createProps(
				[routeIndex, routeA, routeB],
				{
					index: descriptorIndex,
					"dynamic-a": descriptorA,
					"dynamic-b": descriptorB,
				},
				navigation,
			),
		);

		const snapshot = controller.getSnapshot();
		expect(snapshot.state.routes.map((route) => route.key)).toEqual([
			"index",
			"dynamic-a",
			"dynamic-b",
		]);
		expect(snapshot.state.scenes.map((scene) => scene.activity)).toEqual([
			"inert",
			"closing",
			"active",
		]);
		expect(snapshot.state.scenes[0]?.nextDescriptor?.route).toBe(
			descriptorB.route,
		);
	});

	it("accepts React Navigation removal for a route already marked closing", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const descriptorA = createDescriptor(routeA, navigation);
		const descriptorB = createDescriptor(routeB, navigation);
		const controller = createBlankStackController(
			createProps(
				[routeA, routeB],
				{ a: descriptorA, b: descriptorB },
				navigation,
			),
		);

		expect(controller.requestDismiss({ route: routeB })).toBe(true);

		controller.update(createProps([routeA], { a: descriptorA }, navigation));

		const snapshot = controller.getSnapshot();
		expect(snapshot.state.routes.map((route) => route.key)).toEqual(["a"]);
		expect(snapshot.state.descriptors.b).toBeUndefined();
		expect(snapshot.state.closingRouteKeys.has("b")).toBe(false);
	});

	it("skips state updates for fresh equivalent route descriptors", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const routeC = createRoute("c");
		const options = {
			gestureEnabled: true,
		} as BaseStackDescriptor["options"];
		const controller = createBlankStackController(
			createProps(
				[routeA, routeB, routeC],
				{
					a: createDescriptor(routeA, navigation, options),
					b: createDescriptor(routeB, navigation, options),
					c: createDescriptor(routeC, navigation, options),
				},
				navigation,
			),
		);

		const beforeState = controller.getSnapshot().state;
		const freshRouteA = createRoute("a");
		const freshRouteB = createRoute("b");
		const freshRouteC = createRoute("c");

		controller.update(
			createProps(
				[freshRouteA, freshRouteB, freshRouteC],
				{
					a: createDescriptor(freshRouteA, navigation, options),
					b: createDescriptor(freshRouteB, navigation, options),
					c: createDescriptor(freshRouteC, navigation, options),
				},
				navigation,
			),
		);

		const afterState = controller.getSnapshot().state;
		expect(afterState).toBe(beforeState);
		expect(afterState.sourceDescriptors).toBe(beforeState.sourceDescriptors);
		expect(afterState.scenes).toBe(beforeState.scenes);
	});

	it("updates scenes when a cached route child state changes", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const routeC = createRoute("c");
		const options = {
			gestureEnabled: true,
		} as BaseStackDescriptor["options"];
		const initialChildState = {
			index: 0,
			routes: [{ key: "index", name: "index" }],
		};
		const nextChildState = {
			index: 1,
			routes: [
				{ key: "index", name: "index" },
				{ key: "style-id", name: "style-id" },
			],
		};

		setRouteChildState(routeC, initialChildState);

		const controller = createBlankStackController(
			createProps(
				[routeA, routeB, routeC],
				{
					a: createDescriptor(routeA, navigation, options),
					b: createDescriptor(routeB, navigation, options),
					c: createDescriptor(routeC, navigation, options),
				},
				navigation,
			),
		);

		const beforeState = controller.getSnapshot().state;

		setRouteChildState(routeC, nextChildState);

		controller.update(
			createProps(
				[routeA, routeB, routeC],
				{
					a: createDescriptor(routeA, navigation, options),
					b: createDescriptor(routeB, navigation, options),
					c: createDescriptor(routeC, navigation, options),
				},
				navigation,
			),
		);

		const afterState = controller.getSnapshot().state;
		expect(afterState).not.toBe(beforeState);
		expect(afterState.routeChildStates.c).toBe(nextChildState);
		expect(afterState.scenes[2]).not.toBe(beforeState.scenes[2]);
	});
});

for (const completionOrder of [["C", "B"], ["B", "C"]]) {
 it(`retains successive popped scenes until each closes: ${completionOrder}`, () => {
  const navigation = createNavigation();
  const routes = ["A", "B", "C"].map(createRoute);
  const descriptors = Object.fromEntries(routes.map(route => [route.key, createDescriptor(route, navigation)]));
  const props = (count: number) => createProps(routes.slice(0, count), Object.fromEntries(routes.slice(0, count).map(route => [route.key, descriptors[route.key]])), navigation);
  const controller = createBlankStackController(props(3));
  controller.update(props(2));
  const retained = controller.getSnapshot().state.descriptors.C;
  controller.update(props(1));
  expect(controller.getSnapshot().state.routeKeys).toEqual(["A", "B", "C"]);
  expect(controller.getSnapshot().state.descriptors.C).toBe(retained);
  expect([...controller.getSnapshot().state.closingRouteKeys]).toEqual(["C", "B"]);
  for (const key of completionOrder) {
   controller.handleCloseRoute({route: routes.find(route => route.key === key)!});
   expect(controller.getSnapshot().state.routeKeys).not.toContain(key);
  }
  expect(controller.getSnapshot().state.routeKeys).toEqual(["A"]);
 });
}

// From #159 (Vlad Petrenko): a params-only change must render the fresh descriptor.
it("renders with the fresh descriptor when only route params change", () => {
	const navigation = createNavigation();
	const options = {
		gestureEnabled: true,
	} as BaseStackDescriptor["options"];
	const createRenderableDescriptor = (route: BaseStackRoute) => ({
		...createDescriptor(route, navigation, options),
		render: () => route,
	});

	const routeA = createRoute("a");
	const routeB: BaseStackRoute = {
		...createRoute("b"),
		params: { screen: "home" },
	};
	const controller = createBlankStackController(
		createProps(
			[routeA, routeB],
			{
				a: createRenderableDescriptor(routeA),
				b: createRenderableDescriptor(routeB),
			},
			navigation,
		),
	);

	// A deep link into a nested navigator only changes the parent route's
	// params; its child state is untouched until the nested stack reads them.
	const nextRouteB: BaseStackRoute = {
		...createRoute("b"),
		params: { screen: "settings" },
	};
	const nextDescriptorB = createRenderableDescriptor(nextRouteB);

	controller.update(
		createProps(
			[routeA, nextRouteB],
			{ a: createRenderableDescriptor(routeA), b: nextDescriptorB },
			navigation,
		),
	);

	const afterState = controller.getSnapshot().state;
	expect(afterState.descriptors.b.route).toBe(nextRouteB);
	expect(afterState.descriptors.b.render).toBe(nextDescriptorB.render);
	expect(afterState.descriptors.b.render()).toBe(nextRouteB);
});
