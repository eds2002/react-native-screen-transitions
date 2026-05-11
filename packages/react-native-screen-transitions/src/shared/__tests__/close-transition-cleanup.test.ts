import { beforeEach, describe, expect, it } from "bun:test";

import { resetStoresForScreen } from "../components/screen-lifecycle/hooks/helpers/reset-stores-for-screen";
import { AnimationStore } from "../stores/animation.store";
import { BoundStore } from "../stores/bounds";
import { GestureStore } from "../stores/gesture.store";
import { SystemStore } from "../stores/system.store";
import {
	hasBoundaryPresence,
	registerBoundaryPresence,
	registerMeasuredEntry,
} from "./helpers/bounds-behavior-fixtures";

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
	it("resets animation, gesture, system, and bounds stores for a screen", () => {
		const routeKey = "cleanup-screen";
		const bounds = createMeasured(10, 20, 120, 140);

		const animationBefore = AnimationStore.getBag(routeKey);
		const gestureBefore = GestureStore.getBag(routeKey);
		const systemBefore = SystemStore.getBag(routeKey);

		registerMeasuredEntry("card", routeKey, bounds);
		BoundStore.link.setSource("capture", "card", routeKey, bounds);
		registerBoundaryPresence("card", routeKey);

		expect(BoundStore.entry.get("card", routeKey)).toBeTruthy();
		expect(BoundStore.link.hasSource("card", routeKey)).toBe(true);
		expect(hasBoundaryPresence("card", routeKey)).toBe(true);

		resetStoresForScreen(routeKey);
		resetStoresForScreen(routeKey);

		expect(BoundStore.entry.get("card", routeKey)).toBeNull();
		expect(BoundStore.link.hasSource("card", routeKey)).toBe(false);
		expect(hasBoundaryPresence("card", routeKey)).toBe(false);

		const animationAfter = AnimationStore.getBag(routeKey);
		const gestureAfter = GestureStore.getBag(routeKey);
		const systemAfter = SystemStore.getBag(routeKey);

		expect(animationAfter).not.toBe(animationBefore);
		expect(gestureAfter).not.toBe(gestureBefore);
		expect(systemAfter).not.toBe(systemBefore);
	});

	it("clears bounds for leaf screens", () => {
		const routeKey = "leaf-screen";
		const bounds = createMeasured(10, 20, 120, 140);

		registerMeasuredEntry("card", routeKey, bounds);
		BoundStore.link.setSource("capture", "card", routeKey, bounds);
		registerBoundaryPresence("card", routeKey);

		const animationBefore = AnimationStore.getBag(routeKey);
		const gestureBefore = GestureStore.getBag(routeKey);
		const systemBefore = SystemStore.getBag(routeKey);

		resetStoresForScreen(routeKey);

		// Animation and gesture stores are still cleared
		const animationAfter = AnimationStore.getBag(routeKey);
		const gestureAfter = GestureStore.getBag(routeKey);
		const systemAfter = SystemStore.getBag(routeKey);
		expect(animationAfter).not.toBe(animationBefore);
		expect(gestureAfter).not.toBe(gestureBefore);
		expect(systemAfter).not.toBe(systemBefore);

		expect(BoundStore.entry.get("card", routeKey)).toBeNull();
		expect(BoundStore.link.hasSource("card", routeKey)).toBe(false);
		expect(hasBoundaryPresence("card", routeKey)).toBe(false);
	});

	it("clear removes only the direct presence entry for a route key", () => {
		const routeKey = "cleanup-route";
		const descendantRoute = "cleanup-route-descendant";

		registerBoundaryPresence("card", routeKey);
		registerBoundaryPresence("card", descendantRoute);

		BoundStore.cleanup.byScreen(routeKey);

		expect(hasBoundaryPresence("card", descendantRoute)).toBe(true);

		BoundStore.entry.remove("card", descendantRoute);

		expect(hasBoundaryPresence("card", routeKey)).toBe(false);
	});

	it("screen cleanup does not clear sibling or nested route keys", () => {
		const routeKey = "cleanup-route";
		const nestedRoute = "cleanup-route-nested";
		const unrelatedRoute = "unrelated-route";
		const bounds = createMeasured(12, 24, 130, 150);

		registerMeasuredEntry("card", routeKey, bounds);
		BoundStore.link.setSource("capture",
			"card",
			routeKey,
			bounds,
			{},
		);
		registerBoundaryPresence("card", routeKey);

		registerMeasuredEntry("card", nestedRoute, bounds);
		BoundStore.link.setSource("capture",
			"card",
			nestedRoute,
			bounds,
			{},
		);
		registerBoundaryPresence("card", nestedRoute);

		registerMeasuredEntry("card", unrelatedRoute, bounds);
		BoundStore.link.setSource("capture", "card", unrelatedRoute, bounds);
		registerBoundaryPresence("card", unrelatedRoute);

		resetStoresForScreen(routeKey);

		expect(BoundStore.entry.get("card", routeKey)).toBeNull();
		expect(BoundStore.link.hasSource("card", routeKey)).toBe(false);
		expect(hasBoundaryPresence("card", routeKey)).toBe(false);

		expect(BoundStore.entry.get("card", nestedRoute)).toBeTruthy();
		expect(BoundStore.link.hasSource("card", nestedRoute)).toBe(true);
		expect(hasBoundaryPresence("card", nestedRoute)).toBe(true);

		expect(BoundStore.entry.get("card", unrelatedRoute)).toBeTruthy();
		expect(BoundStore.link.hasSource("card", unrelatedRoute)).toBe(true);
		expect(hasBoundaryPresence("card", unrelatedRoute)).toBe(true);
	});
});
