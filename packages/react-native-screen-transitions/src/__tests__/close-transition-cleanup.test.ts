import { mountMotionValues } from "./helpers/mount-motion-values";
import { beforeEach, describe, expect, it } from "bun:test";

import { resetStoresForScreen } from "../components/screen-lifecycle/hooks/helpers/reset-stores-for-screen";
import { BoundStore } from "../stores/bounds";
import { createPendingPairKey } from "../stores/bounds/helpers/link-pairs.helpers";
import {
	hasBoundaryPresence,
	registerBoundaryPresence,
	registerMeasuredEntry,
} from "./bounds/helpers/bounds-behavior-fixtures";

const createMeasured = (x = 0, y = 0, width = 100, height = 100) => ({
	x,
	y,
	pageX: x,
	pageY: y,
	width,
	height,
});

const flushScheduledUI = async () => {
	await Promise.resolve();
	await new Promise<void>((resolve) => setTimeout(resolve, 0));
};

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("close transition cleanup", () => {
	it("clears bounds without resetting provider-owned motion", async () => {
		const routeKey = "cleanup-screen";
		const bounds = createMeasured(10, 20, 120, 140);

		const motion = mountMotionValues();
		motion.transitionProgress.set(0.5);
		motion.x.set(20);

		registerMeasuredEntry("card", routeKey, bounds);
		const pairKey = createPendingPairKey(routeKey);
		BoundStore.link.setSource(pairKey, "card", routeKey, bounds);
		registerBoundaryPresence("card", routeKey);

		expect(BoundStore.entry.get("card", routeKey)).toBeTruthy();
		expect(BoundStore.link.getSource(pairKey, "card")).not.toBeNull();
		expect(hasBoundaryPresence("card", routeKey)).toBe(true);

		resetStoresForScreen(routeKey);
		resetStoresForScreen(routeKey);
		await flushScheduledUI();

		expect(BoundStore.entry.get("card", routeKey)).toBeNull();
		expect(BoundStore.link.getSource(pairKey, "card")).toBeNull();
		expect(hasBoundaryPresence("card", routeKey)).toBe(false);

		expect(motion.transitionProgress.get()).toBe(0.5);
		expect(motion.x.get()).toBe(20);
	});

	it("clears bounds for leaf screens", async () => {
		const routeKey = "leaf-screen";
		const bounds = createMeasured(10, 20, 120, 140);

		registerMeasuredEntry("card", routeKey, bounds);
		const pairKey = createPendingPairKey(routeKey);
		BoundStore.link.setSource(pairKey, "card", routeKey, bounds);
		registerBoundaryPresence("card", routeKey);

		const motion = mountMotionValues();
		motion.transitionProgress.set(0.5);
		motion.x.set(20);

		resetStoresForScreen(routeKey);
		await flushScheduledUI();

		// Motion belongs to the mounted provider.

		expect(motion.transitionProgress.get()).toBe(0.5);
		expect(motion.x.get()).toBe(20);

		expect(BoundStore.entry.get("card", routeKey)).toBeNull();
		expect(BoundStore.link.getSource(pairKey, "card")).toBeNull();
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

	it("screen cleanup does not clear sibling or nested route keys", async () => {
		const routeKey = "cleanup-route";
		const nestedRoute = "cleanup-route-nested";
		const unrelatedRoute = "unrelated-route";
		const bounds = createMeasured(12, 24, 130, 150);
		const routePairKey = createPendingPairKey(routeKey);
		const nestedPairKey = createPendingPairKey(nestedRoute);
		const unrelatedPairKey = createPendingPairKey(unrelatedRoute);

		registerMeasuredEntry("card", routeKey, bounds);
		BoundStore.link.setSource(routePairKey, "card", routeKey, bounds, {});
		registerBoundaryPresence("card", routeKey);

		registerMeasuredEntry("card", nestedRoute, bounds);
		BoundStore.link.setSource(nestedPairKey, "card", nestedRoute, bounds, {});
		registerBoundaryPresence("card", nestedRoute);

		registerMeasuredEntry("card", unrelatedRoute, bounds);
		BoundStore.link.setSource(unrelatedPairKey, "card", unrelatedRoute, bounds);
		registerBoundaryPresence("card", unrelatedRoute);

		resetStoresForScreen(routeKey);
		await flushScheduledUI();

		expect(BoundStore.entry.get("card", routeKey)).toBeNull();
		expect(BoundStore.link.getSource(routePairKey, "card")).toBeNull();
		expect(hasBoundaryPresence("card", routeKey)).toBe(false);

		expect(BoundStore.entry.get("card", nestedRoute)).toBeTruthy();
		expect(BoundStore.link.getSource(nestedPairKey, "card")).not.toBeNull();
		expect(hasBoundaryPresence("card", nestedRoute)).toBe(true);

		expect(BoundStore.entry.get("card", unrelatedRoute)).toBeTruthy();
		expect(BoundStore.link.getSource(unrelatedPairKey, "card")).not.toBeNull();
		expect(hasBoundaryPresence("card", unrelatedRoute)).toBe(true);
	});
});
