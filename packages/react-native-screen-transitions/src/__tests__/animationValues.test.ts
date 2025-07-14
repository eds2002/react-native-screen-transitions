import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import {
	mockRouteStoreImplementation,
	routeSubscriber,
} from "../__mocks__/store.mock";
import type { animationValues as AnimationValuesType } from "../animation-engine";
import "../__mocks__/reanimated.mock";

mock.module("../store/index", () => ({
	RouteStore: mockRouteStoreImplementation,
}));

describe("Animation Engine", () => {
	let animationValues: typeof AnimationValuesType;

	beforeAll(async () => {
		const engineModule = await import("../animation-engine");
		animationValues = engineModule.animationValues;
	});

	beforeEach(() => {
		Object.keys(animationValues).forEach((key) => {
			Object.keys(animationValues[key]).forEach((routeKey) => {
				delete animationValues[key][routeKey];
			});
		});
	});

	describe("when a new route is added", () => {
		test("it should create the animation value and immediately animate it to its initial status", () => {
			expect(routeSubscriber).not.toBeNull();
			if (!routeSubscriber) return;

			const prevRoutes = {};
			const currRoutes = {
				route1: { id: "route1", status: 1 },
			};

			routeSubscriber(currRoutes, prevRoutes);

			Object.keys(animationValues.screenProgress).forEach((key) => {
				expect(animationValues.screenProgress[key]).toBeDefined();
				expect(animationValues.screenProgress[key].value).toBe(1);
			});
		});
	});
	describe("when a route is removed", () => {
		test("it should delete the animation values for that route", () => {
			expect(routeSubscriber).not.toBeNull();
			if (!routeSubscriber) return;

			const initialPrevRoutes = {};
			const initialCurrRoutes = {
				route1: { id: "route1", status: 1 },
				route2: { id: "route2", status: 1 },
			};
			routeSubscriber(initialCurrRoutes, initialPrevRoutes);

			// make sure route2 values were actually created.
			expect(animationValues.screenProgress.route2).toBeDefined();
			expect(animationValues.gestureX.route2).toBeDefined();

			// Remove the route
			const nextPrevRoutes = initialCurrRoutes;
			const nextCurrRoutes = {
				route1: { id: "route1", status: 1 },
			};
			routeSubscriber(nextCurrRoutes, nextPrevRoutes);

			// check that the values for the removed route are gone.
			expect(animationValues.screenProgress.route2).toBeUndefined();
			expect(animationValues.gestureX.route2).toBeUndefined();
			expect(animationValues.gestureY.route2).toBeUndefined();

			// check that the values for the remaining route are still there.
			expect(animationValues.screenProgress.route1).toBeDefined();
			expect(animationValues.gestureX.route1).toBeDefined();
		});
	});
});
