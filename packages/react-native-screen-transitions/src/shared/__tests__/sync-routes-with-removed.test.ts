import { beforeEach, describe, expect, it } from "bun:test";
import { AnimationStore } from "../stores/animation.store";
import { GestureStore } from "../stores/gesture.store";
import { syncRoutesWithRemoved } from "../utils/navigation/sync-routes-with-removed";

const createRoute = (key: string) => ({ key });

const createClosingRouteKeys = () => {
	const keys = new Set<string>();
	const sharedValue: string[] = [];
	return {
		ref: { current: keys } as React.RefObject<Set<string>>,
		shared: {
			value: sharedValue,
			get: () => sharedValue,
			set: (v: string[]) => {
				sharedValue.length = 0;
				sharedValue.push(...v);
			},
			addListener: () => () => {},
			removeListener: () => {},
			modify: (fn?: (v: string[]) => string[], _forceUpdate?: boolean) => {
				if (fn) {
					const result = fn(sharedValue);
					sharedValue.length = 0;
					sharedValue.push(...result);
				}
			},
		},
		add: (key: string) => {
			keys.add(key);
		},
		remove: (key: string) => {
			keys.delete(key);
		},
		clear: () => keys.clear(),
	};
};

// Helper to set up a route's animation state
const setRouteState = (
	routeKey: string,
	state: {
		progress?: number;
		closing?: number;
		dragging?: number;
		dismissing?: number;
	},
) => {
	const animations = AnimationStore.getRouteAnimations(routeKey);
	const gestures = GestureStore.getRouteGestures(routeKey);

	if (state.progress !== undefined) animations.progress.value = state.progress;
	if (state.closing !== undefined) animations.closing.value = state.closing;
	if (state.dragging !== undefined)
		gestures.dragging.value = state.dragging;
	if (state.dismissing !== undefined)
		gestures.dismissing.value = state.dismissing;
};

// Reset stores before each test
beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("syncRoutesWithRemoved", () => {
	describe("basic routing", () => {
		it("returns empty routes when nextRoutes is empty", () => {
			const closingRouteKeys = createClosingRouteKeys();
			const result = syncRoutesWithRemoved({
				prevRoutes: [createRoute("a")],
				prevDescriptors: {},
				nextRoutes: [],
				nextDescriptors: {},
				closingRouteKeys,
			});
			expect(result.routes).toEqual([]);
		});

		it("returns nextRoutes unchanged for normal push (A -> B)", () => {
			const closingRouteKeys = createClosingRouteKeys();

			// Both routes fully visible
			setRouteState("a", { progress: 1 });
			setRouteState("b", { progress: 1 });

			const result = syncRoutesWithRemoved({
				prevRoutes: [createRoute("a")],
				prevDescriptors: { a: {} },
				nextRoutes: [createRoute("a"), createRoute("b")],
				nextDescriptors: { a: {}, b: {} },
				closingRouteKeys,
			});
			expect(result.routes.map((r) => r.key)).toEqual(["a", "b"]);
		});

		it("returns nextRoutes unchanged for normal stack (A -> B -> C)", () => {
			const closingRouteKeys = createClosingRouteKeys();

			setRouteState("a", { progress: 1 });
			setRouteState("b", { progress: 1 });
			setRouteState("c", { progress: 1 });

			const result = syncRoutesWithRemoved({
				prevRoutes: [createRoute("a"), createRoute("b")],
				prevDescriptors: { a: {}, b: {} },
				nextRoutes: [createRoute("a"), createRoute("b"), createRoute("c")],
				nextDescriptors: { a: {}, b: {}, c: {} },
				closingRouteKeys,
			});
			expect(result.routes.map((r) => r.key)).toEqual(["a", "b", "c"]);
		});
	});


	describe("normal back navigation", () => {
		it("keeps closing route at end for normal back (C -> B)", () => {
			const closingRouteKeys = createClosingRouteKeys();

			setRouteState("a", { progress: 1 });
			setRouteState("b", { progress: 1 });
			setRouteState("c", { progress: 1 });

			const result = syncRoutesWithRemoved({
				prevRoutes: [createRoute("a"), createRoute("b"), createRoute("c")],
				prevDescriptors: { a: {}, b: {}, c: {} },
				nextRoutes: [createRoute("a"), createRoute("b")],
				nextDescriptors: { a: {}, b: {} },
				closingRouteKeys,
			});

			// c should be added to end for close animation
			expect(result.routes.map((r) => r.key)).toEqual(["a", "b", "c"]);
			expect(closingRouteKeys.ref.current.has("c")).toBe(true);
		});
	});
});
