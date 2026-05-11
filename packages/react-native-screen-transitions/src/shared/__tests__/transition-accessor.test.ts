import { beforeAll, describe, expect, it, mock } from "bun:test";
import type * as TransitionAccessorModule from "../providers/screen/animation/helpers/accessors/use-build-transition-accessor";
import type { TransitionAccessorSource } from "../providers/screen/animation/helpers/accessors/use-build-transition-accessor";
import type { ScreenInterpolatorFrame } from "../providers/screen/animation/helpers/pipeline";
import type { ScreenAnimationDescendantSources } from "../providers/screen/animation/types";

mock.module("../providers/screen/animation/animation.provider", () => ({
	useScreenAnimationContext: () => ({
		screenInterpolatorProps: { get: () => ({}) },
		screenInterpolatorFrameUpdater: { get: () => 0 },
		ancestorScreenAnimationSources: [],
		descendantScreenAnimationSources: { get: () => [] },
	}),
}));

let createTransitionAccessor: typeof TransitionAccessorModule.createTransitionAccessor;

const createSource = (routeKey: string): TransitionAccessorSource => {
	const frame = {
		current: {
			route: { key: routeKey },
		},
	} as unknown as ScreenInterpolatorFrame;

	return {
		screenInterpolatorProps: {
			get: () => frame,
		} as TransitionAccessorSource["screenInterpolatorProps"],
		screenInterpolatorFrameUpdater: {
			get: () => 0,
		},
		boundsAccessor: {
			id: routeKey,
		} as unknown as TransitionAccessorSource["boundsAccessor"],
	};
};

describe("createTransitionAccessor", () => {
	beforeAll(async () => {
		const module = await import(
			"../providers/screen/animation/helpers/accessors/use-build-transition-accessor"
		);
		createTransitionAccessor = module.createTransitionAccessor;
	});

	it("resolves self by default and depth 0", () => {
		const grandparent = createSource("grandparent");
		const parent = createSource("parent");
		const self = createSource("self");
		const child = createSource("child");
		const transition = createTransitionAccessor(
			[grandparent, parent, self, child],
			2,
		);
		const scope = transition();

		expect(scope?.current.route.key).toBe("self");
		expect(scope?.bounds).toBe(self.boundsAccessor);
		expect(transition({ depth: 0 })?.current.route.key).toBe("self");
	});

	it("resolves negative depth to ancestors", () => {
		const grandparent = createSource("grandparent");
		const parent = createSource("parent");
		const self = createSource("self");
		const child = createSource("child");
		const transition = createTransitionAccessor(
			[grandparent, parent, self, child],
			2,
		);

		expect(transition({ depth: -1 })?.current.route.key).toBe("parent");
		expect(transition({ depth: -2 })?.current.route.key).toBe("grandparent");
	});

	it("resolves positive depth to descendants", () => {
		const grandparent = createSource("grandparent");
		const parent = createSource("parent");
		const self = createSource("self");
		const child = createSource("child");
		const grandchild = createSource("grandchild");
		const transition = createTransitionAccessor(
			[grandparent, parent, self, child, grandchild],
			2,
		);

		expect(transition({ depth: 1 })?.current.route.key).toBe("child");
		expect(transition({ depth: 2 })?.current.route.key).toBe("grandchild");
	});

	it("reads descendant sources without rebuilding the accessor", () => {
		const grandparent = createSource("grandparent");
		const parent = createSource("parent");
		const self = createSource("self");
		const child = createSource("child");
		const grandchild = createSource("grandchild");
		let registered = [] as ScreenAnimationDescendantSources["value"];
		const descendants: ScreenAnimationDescendantSources = {
			get: () => registered,
		} as ScreenAnimationDescendantSources;
		const transition = createTransitionAccessor(
			[grandparent, parent, self],
			2,
			descendants,
		);

		expect(transition({ depth: 1 })).toBeNull();

		registered = [
			{ source: child, depth: 1 },
			{ source: grandchild, depth: 2 },
		];

		expect(transition({ depth: 1 })?.current.route.key).toBe("child");
		expect(transition({ depth: 2 })?.current.route.key).toBe("grandchild");
	});

	it("resolves nested transition calls relative to the current scope", () => {
		const grandparent = createSource("grandparent");
		const parent = createSource("parent");
		const self = createSource("self");
		const child = createSource("child");
		const transition = createTransitionAccessor(
			[grandparent, parent, self, child],
			2,
		);
		const parentScope = transition({ depth: -1 });
		const grandparentScope = parentScope?.transition({ depth: -1 });
		const childScope = parentScope?.transition({ depth: 2 });

		expect(grandparentScope?.current.route.key).toBe("grandparent");
		expect(childScope?.current.route.key).toBe("child");
	});

	it("returns null for missing or invalid depth targets", () => {
		const grandparent = createSource("grandparent");
		const parent = createSource("parent");
		const self = createSource("self");
		const child = createSource("child");
		const transition = createTransitionAccessor(
			[grandparent, parent, self, child],
			2,
		);

		expect(transition({ depth: 10 })).toBeNull();
		expect(transition({ depth: -10 })).toBeNull();
		expect(transition({ depth: 1.5 })).toBeNull();
	});
});
