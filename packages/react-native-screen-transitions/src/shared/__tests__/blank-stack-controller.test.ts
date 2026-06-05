import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { BlankStackProviderProps } from "../types/providers/blank-stack-provider.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
	BaseStackRoute,
} from "../types/stack.types";

mock.module("@react-navigation/native", () => ({
	StackActions: {
		pop: () => ({ type: "POP" }),
	},
}));

const { createBlankStackController } = await import(
	"../providers/stack/blank-stack-state/blank-stack-controller"
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
	activity: "inactive",
});

const createProps = (
	routes: BaseStackRoute[],
	descriptors: Record<string, BaseStackDescriptor>,
	navigation: BaseStackNavigation,
): BlankStackProviderProps<BaseStackDescriptor, BaseStackNavigation> => ({
	state: {
		key: "stack",
		index: routes.length - 1,
		routes,
	},
	navigation,
	descriptors,
	describe: (route) => descriptors[route.key],
});

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("createBlankStackController", () => {
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
		expect(snapshot.state.descriptors.c?.activity).toBe("closing");
		expect(descriptorC.activity).toBe("inactive");
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
		expect(snapshot.state.scenes.map((scene) => scene.descriptor.activity)).toEqual(
			["inactive", "inert", "closing"],
		);
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
		expect(snapshot.state.scenes.map((scene) => scene.descriptor.activity)).toEqual(
			["inert", "closing"],
		);
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
		const controller = createManagedStackController(
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
		expect(snapshot.state.scenes.map((scene) => scene.descriptor.activity)).toEqual(
			["inert", "closing", "active"],
		);
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
