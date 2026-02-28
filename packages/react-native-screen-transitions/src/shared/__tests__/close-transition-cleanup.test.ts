import { beforeEach, describe, expect, it } from "bun:test";

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

const resetStoresForScreenForTest = (
	routeKey: string,
	isBranchScreen: boolean,
	branchNavigatorKey?: string,
) => {
	AnimationStore.clear(routeKey);
	GestureStore.clear(routeKey);

	if (!isBranchScreen) return;

	BoundStore.clear(routeKey);

	if (branchNavigatorKey) {
		BoundStore.clearByBranch(branchNavigatorKey);
		return;
	}

	BoundStore.clearByAncestor(routeKey);
};

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

		resetStoresForScreenForTest(routeKey, true);
		resetStoresForScreenForTest(routeKey, true);

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

		resetStoresForScreenForTest(routeKey, false);

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

	it("clears branch-associated entries when a branch navigator key is provided", () => {
		const routeKey = "branch-host-screen";
		const branchNavigatorKey = "nav-branch";
		const directBranchRoute = "direct-branch-route";
		const descendantBranchRoute = "descendant-branch-route";
		const unrelatedRoute = "unrelated-route";
		const bounds = createMeasured(12, 24, 130, 150);

		BoundStore.registerSnapshot(
			"card",
			directBranchRoute,
			bounds,
			{},
			[],
			branchNavigatorKey,
		);
		BoundStore.setLinkSource(
			"card",
			directBranchRoute,
			bounds,
			{},
			[],
			branchNavigatorKey,
		);
		BoundStore.registerBoundaryPresence(
			"card",
			directBranchRoute,
			[],
			undefined,
			branchNavigatorKey,
		);

		BoundStore.registerSnapshot(
			"card",
			descendantBranchRoute,
			bounds,
			{},
			[],
			"nav-child",
			[branchNavigatorKey],
		);
		BoundStore.setLinkSource(
			"card",
			descendantBranchRoute,
			bounds,
			{},
			[],
			"nav-child",
			[branchNavigatorKey],
		);
		BoundStore.registerBoundaryPresence(
			"card",
			descendantBranchRoute,
			[],
			undefined,
			"nav-child",
			[branchNavigatorKey],
		);

		BoundStore.registerSnapshot(
			"card",
			unrelatedRoute,
			bounds,
			{},
			[],
			"nav-other",
		);
		BoundStore.setLinkSource("card", unrelatedRoute, bounds, {}, [], "nav-other");
		BoundStore.registerBoundaryPresence(
			"card",
			unrelatedRoute,
			[],
			undefined,
			"nav-other",
		);

		resetStoresForScreenForTest(routeKey, true, branchNavigatorKey);

		expect(BoundStore.getSnapshot("card", directBranchRoute)).toBeNull();
		expect(BoundStore.hasSourceLink("card", directBranchRoute)).toBe(false);
		expect(BoundStore.hasBoundaryPresence("card", directBranchRoute)).toBe(
			false,
		);

		expect(BoundStore.getSnapshot("card", descendantBranchRoute)).toBeNull();
		expect(BoundStore.hasSourceLink("card", descendantBranchRoute)).toBe(false);
		expect(BoundStore.hasBoundaryPresence("card", descendantBranchRoute)).toBe(
			false,
		);

		expect(BoundStore.getSnapshot("card", unrelatedRoute)).toBeTruthy();
		expect(BoundStore.hasSourceLink("card", unrelatedRoute)).toBe(true);
		expect(BoundStore.hasBoundaryPresence("card", unrelatedRoute)).toBe(true);
	});
});
