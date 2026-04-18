import { beforeEach, describe, expect, it } from "bun:test";

import { resetStoresForScreen } from "../components/screen-lifecycle/hooks/helpers/reset-stores-for-screen";
import { AnimationStore } from "../stores/animation.store";
import { BoundStore } from "../stores/bounds";
import { GestureStore } from "../stores/gesture.store";
import { SystemStore } from "../stores/system.store";

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

		const animationBefore = AnimationStore.getBag(routeKey);
		const gestureBefore = GestureStore.getBag(routeKey);
		const systemBefore = SystemStore.getBag(routeKey);

		BoundStore.entry.set("card", routeKey, {
			bounds,
			ancestorKeys: [routeKey],
		});
		BoundStore.link.setSource("capture", "card", routeKey, bounds);

		expect(BoundStore.entry.getMeasured("card", routeKey)).toBeTruthy();
		expect(BoundStore.link.hasSource("card", routeKey)).toBe(true);
		expect(BoundStore.entry.get("card", routeKey)).not.toBeNull();

		resetStoresForScreen(routeKey, true);
		resetStoresForScreen(routeKey, true);

		expect(BoundStore.entry.getMeasured("card", routeKey)).toBeNull();
		expect(BoundStore.link.hasSource("card", routeKey)).toBe(false);
		expect(BoundStore.entry.get("card", routeKey)).toBeNull();

		const animationAfter = AnimationStore.getBag(routeKey);
		const gestureAfter = GestureStore.getBag(routeKey);
		const systemAfter = SystemStore.getBag(routeKey);

		expect(animationAfter).not.toBe(animationBefore);
		expect(gestureAfter).not.toBe(gestureBefore);
		expect(systemAfter).not.toBe(systemBefore);
	});

	it("skips ancestor bound clearing for leaf screens", () => {
		const routeKey = "leaf-screen";
		const bounds = createMeasured(10, 20, 120, 140);

		BoundStore.entry.set("card", routeKey, {
			bounds,
			ancestorKeys: [routeKey],
		});
		BoundStore.link.setSource("capture", "card", routeKey, bounds);

		const animationBefore = AnimationStore.getBag(routeKey);
		const gestureBefore = GestureStore.getBag(routeKey);
		const systemBefore = SystemStore.getBag(routeKey);

		resetStoresForScreen(routeKey, false);

		// Animation and gesture stores are still cleared
		const animationAfter = AnimationStore.getBag(routeKey);
		const gestureAfter = GestureStore.getBag(routeKey);
		const systemAfter = SystemStore.getBag(routeKey);
		expect(animationAfter).not.toBe(animationBefore);
		expect(gestureAfter).not.toBe(gestureBefore);
		expect(systemAfter).not.toBe(systemBefore);

		// Bound data registered directly under this key is NOT cleared by
		// clearByAncestor (which is skipped), so the measured entry and source link
		// remain intact — only ancestor-based clearing is gated.
		expect(BoundStore.entry.getMeasured("card", routeKey)).toBeTruthy();
		expect(BoundStore.link.hasSource("card", routeKey)).toBe(true);
		expect(BoundStore.entry.get("card", routeKey)).not.toBeNull();
	});

	it("clear removes only the direct presence entry for a route key", () => {
		const routeKey = "cleanup-route";
		const descendantRoute = "cleanup-route-descendant";

		BoundStore.entry.set("card", routeKey, {});
		BoundStore.entry.set("card", descendantRoute, {
			ancestorKeys: [routeKey],
		});

		BoundStore.cleanup.byScreen(routeKey);

		expect(BoundStore.entry.get("card", descendantRoute)).not.toBeNull();

		BoundStore.entry.remove("card", descendantRoute);

		expect(BoundStore.entry.get("card", routeKey)).toBeNull();
	});

	it("clearByAncestor removes descendant presence entries and preserves unrelated ones", () => {
		const ancestorKey = "stack-cleanup";
		const descendantRoute = "stack-cleanup-child";
		const unrelatedRoute = "other-stack-child";

		BoundStore.entry.set("card", descendantRoute, {
			ancestorKeys: [ancestorKey],
		});
		BoundStore.entry.set("card", unrelatedRoute, {
			ancestorKeys: ["other-stack"],
		});

		BoundStore.cleanup.byAncestor(ancestorKey);

		expect(BoundStore.entry.get("card", descendantRoute)).toBeNull();
		expect(BoundStore.entry.get("card", unrelatedRoute)).not.toBeNull();
	});

	it("clears branch-associated entries when a branch navigator key is provided", () => {
		const routeKey = "branch-host-screen";
		const branchNavigatorKey = "nav-branch";
		const directBranchRoute = "direct-branch-route";
		const descendantBranchRoute = "descendant-branch-route";
		const unrelatedRoute = "unrelated-route";
		const bounds = createMeasured(12, 24, 130, 150);

		BoundStore.entry.set("card", directBranchRoute, {
			bounds,
			ancestorKeys: [],
			navigatorKey: branchNavigatorKey,
		});
		BoundStore.link.setSource("capture", 
			"card",
			directBranchRoute,
			bounds,
			{},
			[],
			branchNavigatorKey,
		);
		BoundStore.entry.set("card", descendantBranchRoute, {
			bounds,
			ancestorKeys: [],
			navigatorKey: "nav-child",
			ancestorNavigatorKeys: [branchNavigatorKey],
		});
		BoundStore.link.setSource("capture", 
			"card",
			descendantBranchRoute,
			bounds,
			{},
			[],
			"nav-child",
			[branchNavigatorKey],
		);
		BoundStore.entry.set("card", unrelatedRoute, {
			bounds,
			ancestorKeys: [],
			navigatorKey: "nav-other",
		});
		BoundStore.link.setSource("capture", "card", unrelatedRoute, bounds, {}, [], "nav-other");

		resetStoresForScreen(routeKey, true, branchNavigatorKey);

		expect(BoundStore.entry.getMeasured("card", directBranchRoute)).toBeNull();
		expect(BoundStore.link.hasSource("card", directBranchRoute)).toBe(false);
		expect(BoundStore.entry.get("card", directBranchRoute)).toBeNull();

		expect(BoundStore.entry.getMeasured("card", descendantBranchRoute)).toBeNull();
		expect(BoundStore.link.hasSource("card", descendantBranchRoute)).toBe(false);
		expect(BoundStore.entry.get("card", descendantBranchRoute)).toBeNull();

		expect(BoundStore.entry.getMeasured("card", unrelatedRoute)).toBeTruthy();
		expect(BoundStore.link.hasSource("card", unrelatedRoute)).toBe(true);
		expect(BoundStore.entry.get("card", unrelatedRoute)).not.toBeNull();
	});
});
