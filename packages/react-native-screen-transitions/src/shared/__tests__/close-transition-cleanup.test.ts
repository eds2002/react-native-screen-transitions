import { beforeEach, describe, expect, it } from "bun:test";
import { resetStoresForRoute } from "../components/screen-lifecycle/hooks/use-close-transition/helpers/reset-stores-for-screen";
import { AnimationStore } from "../stores/animation.store";
import { BoundStore } from "../stores/bounds";
import { GestureStore } from "../stores/gesture.store";

const createMeasured = (
	x = 0,
	y = 0,
	width = 100,
	height = 100,
) => ({
	x,
	y,
	pageX: x,
	pageY: y,
	width,
	height,
});

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("close transition cleanup", () => {
	it("resets animation, gesture, and bounds stores for a branch screen (clears ancestors)", () => {
		const routeKey = "cleanup-screen";
		const bounds = createMeasured(10, 20, 120, 140);

		const animationBefore = AnimationStore.getAll(routeKey);
		const gestureBefore = GestureStore.getRouteGestures(routeKey);

		BoundStore.registerSnapshot("card", routeKey, bounds);
		BoundStore.setLinkSource("card", routeKey, bounds);
		BoundStore.registerBoundaryPresence("card", routeKey, [routeKey]);

		expect(BoundStore.getSnapshot("card", routeKey)).toBeTruthy();
		expect(BoundStore.hasSourceLink("card", routeKey)).toBe(true);
		expect(BoundStore.hasBoundaryPresence("card", routeKey)).toBe(true);

		resetStoresForRoute(routeKey, true);
		resetStoresForRoute(routeKey, true);

		expect(BoundStore.getSnapshot("card", routeKey)).toBeNull();
		expect(BoundStore.hasSourceLink("card", routeKey)).toBe(false);
		expect(BoundStore.hasBoundaryPresence("card", routeKey)).toBe(false);

		const animationAfter = AnimationStore.getAll(routeKey);
		const gestureAfter = GestureStore.getRouteGestures(routeKey);

		expect(animationAfter).not.toBe(animationBefore);
		expect(gestureAfter).not.toBe(gestureBefore);
	});

	it("skips ancestor bound clearing for leaf screens", () => {
		const routeKey = "leaf-screen";
		const bounds = createMeasured(10, 20, 120, 140);

		BoundStore.registerSnapshot("card", routeKey, bounds);
		BoundStore.setLinkSource("card", routeKey, bounds);
		BoundStore.registerBoundaryPresence("card", routeKey, [routeKey]);

		const animationBefore = AnimationStore.getAll(routeKey);
		const gestureBefore = GestureStore.getRouteGestures(routeKey);

		// Leaf screen: isBranchScreen = false — should NOT clearByAncestor
		resetStoresForRoute(routeKey, false);

		// Animation and gesture stores are still cleared
		const animationAfter = AnimationStore.getAll(routeKey);
		const gestureAfter = GestureStore.getRouteGestures(routeKey);
		expect(animationAfter).not.toBe(animationBefore);
		expect(gestureAfter).not.toBe(gestureBefore);

		// Bound data registered directly under this key is NOT cleared by
		// clearByAncestor (which is skipped), so snapshot/source/presence
		// remain intact — only ancestor-based clearing is gated.
		expect(BoundStore.getSnapshot("card", routeKey)).toBeTruthy();
		expect(BoundStore.hasSourceLink("card", routeKey)).toBe(true);
		expect(BoundStore.hasBoundaryPresence("card", routeKey)).toBe(true);
	});
});
