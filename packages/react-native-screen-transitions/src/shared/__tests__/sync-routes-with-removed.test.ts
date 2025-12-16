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
		isDragging?: number;
		isDismissing?: number;
	},
) => {
	const animations = AnimationStore.getAll(routeKey);
	const gestures = GestureStore.getRouteGestures(routeKey);

	if (state.progress !== undefined) animations.progress.value = state.progress;
	if (state.closing !== undefined) animations.closing.value = state.closing;
	if (state.isDragging !== undefined)
		gestures.isDragging.value = state.isDragging;
	if (state.isDismissing !== undefined)
		gestures.isDismissing.value = state.isDismissing;
};

// Reset stores before each test
beforeEach(() => {
	globalThis.resetMutableRegistry();
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

	describe("mid-dismiss route reordering", () => {
		it("moves mid-dismiss route to end when pushing while swiping (progress < 0.5)", () => {
			const closingRouteKeys = createClosingRouteKeys();

			setRouteState("a", { progress: 1 });
			setRouteState("b-old", { progress: 0.3 }); // Mid-dismiss
			setRouteState("b-new", { progress: 0 }); // Just pushed

			const result = syncRoutesWithRemoved({
				prevRoutes: [createRoute("a"), createRoute("b-old")],
				prevDescriptors: { a: {}, "b-old": {} },
				nextRoutes: [
					createRoute("a"),
					createRoute("b-old"),
					createRoute("b-new"),
				],
				nextDescriptors: { a: {}, "b-old": {}, "b-new": {} },
				closingRouteKeys,
			});

			expect(result.routes.map((r) => r.key)).toEqual(["a", "b-new", "b-old"]);
		});

		it("marks moved route as closing", () => {
			const closingRouteKeys = createClosingRouteKeys();

			setRouteState("a", { progress: 1 });
			setRouteState("b-old", { progress: 0.3 });
			setRouteState("b-new", { progress: 0 });

			syncRoutesWithRemoved({
				prevRoutes: [createRoute("a"), createRoute("b-old")],
				prevDescriptors: { a: {}, "b-old": {} },
				nextRoutes: [
					createRoute("a"),
					createRoute("b-old"),
					createRoute("b-new"),
				],
				nextDescriptors: { a: {}, "b-old": {}, "b-new": {} },
				closingRouteKeys,
			});

			expect(closingRouteKeys.ref.current.has("b-old")).toBe(true);
		});

		it("detects dismissing via isDragging flag", () => {
			const closingRouteKeys = createClosingRouteKeys();

			setRouteState("a", { progress: 1 });
			setRouteState("b-old", { progress: 1, isDragging: 1 }); // Being dragged
			setRouteState("b-new", { progress: 0 });

			const result = syncRoutesWithRemoved({
				prevRoutes: [createRoute("a"), createRoute("b-old")],
				prevDescriptors: { a: {}, "b-old": {} },
				nextRoutes: [
					createRoute("a"),
					createRoute("b-old"),
					createRoute("b-new"),
				],
				nextDescriptors: { a: {}, "b-old": {}, "b-new": {} },
				closingRouteKeys,
			});

			expect(result.routes.map((r) => r.key)).toEqual(["a", "b-new", "b-old"]);
		});

		it("detects dismissing via isDismissing flag", () => {
			const closingRouteKeys = createClosingRouteKeys();

			setRouteState("a", { progress: 1 });
			setRouteState("b-old", { progress: 1, isDismissing: 1 });
			setRouteState("b-new", { progress: 0 });

			const result = syncRoutesWithRemoved({
				prevRoutes: [createRoute("a"), createRoute("b-old")],
				prevDescriptors: { a: {}, "b-old": {} },
				nextRoutes: [
					createRoute("a"),
					createRoute("b-old"),
					createRoute("b-new"),
				],
				nextDescriptors: { a: {}, "b-old": {}, "b-new": {} },
				closingRouteKeys,
			});

			expect(result.routes.map((r) => r.key)).toEqual(["a", "b-new", "b-old"]);
		});

		it("detects dismissing via closing flag", () => {
			const closingRouteKeys = createClosingRouteKeys();

			setRouteState("a", { progress: 1 });
			setRouteState("b-old", { progress: 1, closing: 1 });
			setRouteState("b-new", { progress: 0 });

			const result = syncRoutesWithRemoved({
				prevRoutes: [createRoute("a"), createRoute("b-old")],
				prevDescriptors: { a: {}, "b-old": {} },
				nextRoutes: [
					createRoute("a"),
					createRoute("b-old"),
					createRoute("b-new"),
				],
				nextDescriptors: { a: {}, "b-old": {}, "b-new": {} },
				closingRouteKeys,
			});

			expect(result.routes.map((r) => r.key)).toEqual(["a", "b-new", "b-old"]);
		});

		it("does not move first route even if dismissing", () => {
			const closingRouteKeys = createClosingRouteKeys();

			setRouteState("a", { progress: 0.3 }); // First route, low progress
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

		it("does not move last route even if low progress (newly pushed)", () => {
			const closingRouteKeys = createClosingRouteKeys();

			setRouteState("a", { progress: 1 });
			setRouteState("b", { progress: 1 });
			setRouteState("c", { progress: 0.1 }); // Last route, low progress (just pushed)

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
