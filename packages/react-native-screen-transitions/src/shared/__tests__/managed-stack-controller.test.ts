import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { ManagedStackProps } from "../types/providers/managed-stack.types";
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

const { createManagedStackController } = await import(
	"../providers/stack/helpers/managed-stack-state/managed-stack-controller"
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
): ManagedStackProps<BaseStackDescriptor, BaseStackNavigation> => ({
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

describe("createManagedStackController", () => {
	it("retains a removed focused route with its previous descriptor synchronously", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const routeC = createRoute("c");
		const descriptorA = createDescriptor(routeA, navigation);
		const descriptorB = createDescriptor(routeB, navigation);
		const descriptorC = createDescriptor(routeC, navigation);

		const controller = createManagedStackController(
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
		expect(snapshot.state.scenes[2]?.previousDescriptor?.route).toBe(
			descriptorB.route,
		);
		expect(snapshot.state.scenes[2]?.nextDescriptor).toBeUndefined();
		expect(snapshot.state.scenes.map((scene) => scene.descriptor.activity)).toEqual(
			["inactive", "inert", "closing"],
		);
	});

	it("marks only the route directly below the top route as inert", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const routeC = createRoute("c");
		const routeD = createRoute("d");
		const descriptorA = createDescriptor(routeA, navigation);
		const descriptorB = createDescriptor(routeB, navigation);
		const descriptorC = createDescriptor(routeC, navigation);
		const descriptorD = createDescriptor(routeD, navigation);

		const controller = createManagedStackController(
			createProps(
				[routeA, routeB, routeC, routeD],
				{
					a: descriptorA,
					b: descriptorB,
					c: descriptorC,
					d: descriptorD,
				},
				navigation,
			),
		);

		expect(
			controller
				.getSnapshot()
				.state.scenes.map((scene) => scene.descriptor.activity),
		).toEqual(["inactive", "inactive", "inert", "active"]);
	});

	it("does not retain newly opened inactive routes after route reconciliation", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const routeC = createRoute("c");
		const routeD = createRoute("d");
		const descriptorA = createDescriptor(routeA, navigation);
		const descriptorB = createDescriptor(routeB, navigation);
		const descriptorC = createDescriptor(routeC, navigation);
		const descriptorD = createDescriptor(routeD, navigation);
		const controller = createManagedStackController(
			createProps([routeA], { a: descriptorA }, navigation),
		);

		controller.update(
			createProps([routeA, routeB], { a: descriptorA, b: descriptorB }, navigation),
		);
		controller.update(
			createProps(
				[routeA, routeB, routeC],
				{ a: descriptorA, b: descriptorB, c: descriptorC },
				navigation,
			),
		);
		controller.update(
			createProps(
				[routeA, routeB, routeC, routeD],
				{
					a: descriptorA,
					b: descriptorB,
					c: descriptorC,
					d: descriptorD,
				},
				navigation,
			),
		);

		expect(
			controller
				.getSnapshot()
				.state.scenes.map((scene) => scene.descriptor.activity),
		).toEqual(["inactive", "inactive", "inert", "active"]);
	});

	it("emits when a closing route is cleaned up", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const descriptorA = createDescriptor(routeA, navigation);
		const descriptorB = createDescriptor(routeB, navigation);
		const controller = createManagedStackController(
			createProps(
				[routeA, routeB],
				{ a: descriptorA, b: descriptorB },
				navigation,
			),
		);
		let emitCount = 0;
		controller.subscribe(() => {
			emitCount++;
		});

		controller.update(
			createProps([routeA], { a: descriptorA }, navigation),
		);
		controller.handleCloseRoute({ route: routeB });

		expect(emitCount).toBe(1);
		expect(controller.getSnapshot().state.routes.map((route) => route.key)).toEqual([
			"a",
		]);
		expect(controller.getSnapshot().state.descriptors.b).toBeUndefined();
		expect(controller.getSnapshot().state.closingRouteKeys.has("b")).toBe(
			false,
		);
	});

	it("accepts navigation removal for a route already marked closing", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const descriptorA = createDescriptor(routeA, navigation);
		const descriptorB = createDescriptor(routeB, navigation);
		const controller = createManagedStackController(
			createProps(
				[routeA, routeB],
				{ a: descriptorA, b: descriptorB },
				navigation,
			),
		);

		expect(controller.requestDismiss({ route: routeB })).toBe(true);
		expect(controller.getSnapshot().state.closingRouteKeys.has("b")).toBe(true);

		controller.update(createProps([routeA], { a: descriptorA }, navigation));

		expect(controller.getSnapshot().state.routes.map((route) => route.key)).toEqual([
			"a",
		]);
		expect(controller.getSnapshot().state.descriptors.b).toBeUndefined();
		expect(controller.getSnapshot().state.closingRouteKeys.has("b")).toBe(
			false,
		);
	});

	it("keeps the previous route inert when the focused route is soft closing", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const descriptorA = createDescriptor(routeA, navigation);
		const descriptorB = createDescriptor(routeB, navigation);
		const controller = createManagedStackController(
			createProps(
				[routeA, routeB],
				{ a: descriptorA, b: descriptorB },
				navigation,
			),
		);

		expect(controller.requestDismiss({ route: routeB })).toBe(true);

		expect(
			controller
				.getSnapshot()
				.state.scenes.map((scene) => scene.descriptor.activity),
		).toEqual(["inert", "closing"]);
	});

	it("preserves unchanged scene identities when a top route starts soft closing", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const routeC = createRoute("c");
		const routeD = createRoute("d");
		const descriptorA = createDescriptor(routeA, navigation);
		const descriptorB = createDescriptor(routeB, navigation);
		const descriptorC = createDescriptor(routeC, navigation);
		const descriptorD = createDescriptor(routeD, navigation);
		const controller = createManagedStackController(
			createProps(
				[routeA, routeB, routeC, routeD],
				{
					a: descriptorA,
					b: descriptorB,
					c: descriptorC,
					d: descriptorD,
				},
				navigation,
			),
		);

		const beforeScenes = controller.getSnapshot().state.scenes;

		expect(controller.requestDismiss({ route: routeD })).toBe(true);

		const afterScenes = controller.getSnapshot().state.scenes;
		expect(afterScenes[0]).toBe(beforeScenes[0]);
		expect(afterScenes[1]).toBe(beforeScenes[1]);
		expect(afterScenes[2]).toBe(beforeScenes[2]);
		expect(afterScenes[3]).not.toBe(beforeScenes[3]);
	});

	it("preserves scenes below activity changes when a soft-closed top route is removed", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const routeC = createRoute("c");
		const routeD = createRoute("d");
		const descriptorA = createDescriptor(routeA, navigation);
		const descriptorB = createDescriptor(routeB, navigation);
		const descriptorC = createDescriptor(routeC, navigation);
		const descriptorD = createDescriptor(routeD, navigation);
		const controller = createManagedStackController(
			createProps(
				[routeA, routeB, routeC, routeD],
				{
					a: descriptorA,
					b: descriptorB,
					c: descriptorC,
					d: descriptorD,
				},
				navigation,
			),
		);

		expect(controller.requestDismiss({ route: routeD })).toBe(true);
		const softCloseScenes = controller.getSnapshot().state.scenes;

		controller.update(
			createProps(
				[routeA, routeB, routeC],
				{ a: descriptorA, b: descriptorB, c: descriptorC },
				navigation,
			),
		);

		const afterRemovalScenes = controller.getSnapshot().state.scenes;
		expect(controller.getSnapshot().state.routes.map((route) => route.key)).toEqual([
			"a",
			"b",
			"c",
		]);
		expect(
			controller
				.getSnapshot()
				.state.scenes.map((scene) => scene.descriptor.activity),
		).toEqual(["inactive", "inert", "active"]);
		expect(afterRemovalScenes[0]).toBe(softCloseScenes[0]);
		expect(afterRemovalScenes[1]).not.toBe(softCloseScenes[1]);
		expect(afterRemovalScenes[2]).not.toBe(softCloseScenes[2]);
	});

	it("skips state updates for fresh equivalent route descriptors", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const routeC = createRoute("c");
		const options = {
			gestureEnabled: true,
		} as BaseStackDescriptor["options"];
		const controller = createManagedStackController(
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

		const controller = createManagedStackController(
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

	it("preserves unaffected scenes when removal receives fresh equivalent descriptors", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const routeC = createRoute("c");
		const routeD = createRoute("d");
		const descriptorA = createDescriptor(routeA, navigation, {
			gestureEnabled: true,
		} as BaseStackDescriptor["options"]);
		const descriptorB = createDescriptor(routeB, navigation, {
			gestureEnabled: true,
		} as BaseStackDescriptor["options"]);
		const descriptorC = createDescriptor(routeC, navigation, {
			gestureEnabled: true,
		} as BaseStackDescriptor["options"]);
		const descriptorD = createDescriptor(routeD, navigation, {
			gestureEnabled: true,
		} as BaseStackDescriptor["options"]);
		const controller = createManagedStackController(
			createProps(
				[routeA, routeB, routeC, routeD],
				{
					a: descriptorA,
					b: descriptorB,
					c: descriptorC,
					d: descriptorD,
				},
				navigation,
			),
		);

		expect(controller.requestDismiss({ route: routeD })).toBe(true);
		const softCloseState = controller.getSnapshot().state;
		const freshRouteA = createRoute("a");
		const freshRouteB = createRoute("b");
		const freshRouteC = createRoute("c");

		controller.update(
			createProps(
				[freshRouteA, freshRouteB, freshRouteC],
				{
					a: createDescriptor(freshRouteA, navigation, {
						gestureEnabled: true,
					} as BaseStackDescriptor["options"]),
					b: createDescriptor(freshRouteB, navigation, {
						gestureEnabled: true,
					} as BaseStackDescriptor["options"]),
					c: createDescriptor(freshRouteC, navigation, {
						gestureEnabled: true,
					} as BaseStackDescriptor["options"]),
				},
				navigation,
			),
		);

		const afterRemovalState = controller.getSnapshot().state;
		expect(afterRemovalState.scenes[0]).toBe(softCloseState.scenes[0]);
		expect(afterRemovalState.scenes[1]).not.toBe(softCloseState.scenes[1]);
		expect(afterRemovalState.scenes[2]).not.toBe(softCloseState.scenes[2]);
		expect(afterRemovalState.sourceDescriptors.a).toBe(
			softCloseState.sourceDescriptors.a,
		);
		expect(afterRemovalState.scenes[0]?.route).toBe(
			softCloseState.scenes[0]?.route,
		);
	});

	it("accepts only the closing routes React Navigation just removed", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const routeC = createRoute("c");
		const descriptorA = createDescriptor(routeA, navigation);
		const descriptorB = createDescriptor(routeB, navigation);
		const descriptorC = createDescriptor(routeC, navigation);
		const controller = createManagedStackController(
			createProps(
				[routeA, routeB, routeC],
				{ a: descriptorA, b: descriptorB, c: descriptorC },
				navigation,
			),
		);

		expect(controller.requestDismiss({ route: routeB })).toBe(true);
		expect(controller.requestDismiss({ route: routeC })).toBe(true);

		controller.update(
			createProps(
				[routeA, routeB],
				{ a: descriptorA, b: descriptorB },
				navigation,
			),
		);

		expect(controller.getSnapshot().state.routes.map((route) => route.key)).toEqual([
			"a",
			"b",
		]);
		expect(controller.getSnapshot().state.closingRouteKeys.has("b")).toBe(true);
		expect(controller.getSnapshot().state.closingRouteKeys.has("c")).toBe(
			false,
		);
		expect(controller.getSnapshot().state.descriptors.b?.activity).toBe(
			"closing",
		);
		expect(controller.getSnapshot().state.descriptors.c).toBeUndefined();
	});

	it("keeps inactive routes inactive while adjacent routes spam-close", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const routeC = createRoute("c");
		const routeD = createRoute("d");
		const descriptorA = createDescriptor(routeA, navigation);
		const descriptorB = createDescriptor(routeB, navigation);
		const descriptorC = createDescriptor(routeC, navigation);
		const descriptorD = createDescriptor(routeD, navigation);
		const controller = createManagedStackController(
			createProps(
				[routeA, routeB, routeC, routeD],
				{
					a: descriptorA,
					b: descriptorB,
					c: descriptorC,
					d: descriptorD,
				},
				navigation,
			),
		);

		expect(controller.requestDismiss({ route: routeD })).toBe(true);

		expect(
			controller
				.getSnapshot()
				.state.scenes.map((scene) => scene.descriptor.activity),
		).toEqual(["inactive", "inactive", "inert", "closing"]);

		expect(controller.requestDismiss({ route: routeC })).toBe(true);

		expect(
			controller
				.getSnapshot()
				.state.scenes.map((scene) => scene.descriptor.activity),
		).toEqual(["inactive", "inert", "closing", "closing"]);
	});

	it("keeps the next focused route inert while the top route closes", () => {
		const navigation = createNavigation();
		const routeA = createRoute("a");
		const routeB = createRoute("b");
		const routeC = createRoute("c");
		const descriptorA = createDescriptor(routeA, navigation);
		const descriptorB = createDescriptor(routeB, navigation);
		const descriptorC = createDescriptor(routeC, navigation);

		const controller = createManagedStackController(
			createProps(
				[routeA, routeB, routeC],
				{ a: descriptorA, b: descriptorB, c: descriptorC },
				navigation,
			),
		);

		controller.update(
			createProps([routeA, routeB], { a: descriptorA, b: descriptorB }, navigation),
		);

		expect(
			controller
				.getSnapshot()
				.state.scenes.map((scene) => scene.descriptor.activity),
		).toEqual(["inactive", "inert", "closing"]);
	});
});
