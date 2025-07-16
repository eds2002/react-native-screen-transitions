import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import {
	mockScreenStoreImplementation,
	screenSubscriber,
} from "../__mocks__/store.mock";
import type { animationValues as AnimationValuesType } from "../animation-engine";
import "../__mocks__/reanimated.mock";

mock.module("../store/index", () => ({
	ScreenStore: mockScreenStoreImplementation,
}));

describe("Animation Engine", () => {
	let animationValues: typeof AnimationValuesType;

	beforeAll(async () => {
		const engineModule = await import("../animation-engine");
		animationValues = engineModule.animationValues;
	});

	beforeEach(() => {
		Object.keys(animationValues).forEach((key) => {
			Object.keys(animationValues[key]).forEach((screenKey) => {
				delete animationValues[key][screenKey];
			});
		});
	});

	describe("when a new route is added", () => {
		test("it should create the animation value and immediately animate it to its initial status", () => {
			expect(screenSubscriber).not.toBeNull();
			if (!screenSubscriber) return;

			const prevScreens = {};
			const currScreens = {
				screen1: { id: "screen1", status: 1 },
			};

			screenSubscriber(currScreens, prevScreens);

			Object.keys(animationValues.screenProgress).forEach((key) => {
				expect(animationValues.screenProgress[key]).toBeDefined();
				expect(animationValues.screenProgress[key].value).toBe(1);
			});
		});
	});
	describe("when a route is removed", () => {
		test("it should delete the animation values for that route", () => {
			expect(screenSubscriber).not.toBeNull();
			if (!screenSubscriber) return;

			const initialPrevScreens = {};
			const initialCurrScreens = {
				screen1: { id: "screen1", status: 1 },
				screen2: { id: "screen2", status: 1 },
			};
			screenSubscriber(initialCurrScreens, initialPrevScreens);

			// make sure route2 values were actually created.
			expect(animationValues.screenProgress.screen2).toBeDefined();
			expect(animationValues.gestureX.screen2).toBeDefined();

			// Remove the route
			const nextPrevScreens = initialCurrScreens;
			const nextCurrScreens = {
				screen1: { id: "screen1", status: 1 },
			};
			screenSubscriber(nextCurrScreens, nextPrevScreens);

			// check that the values for the removed route are gone.
			expect(animationValues.screenProgress.screen2).toBeUndefined();
			expect(animationValues.gestureX.screen2).toBeUndefined();
			expect(animationValues.gestureY.screen2).toBeUndefined();

			// check that the values for the remaining route are still there.
			expect(animationValues.screenProgress.screen1).toBeDefined();
			expect(animationValues.gestureX.screen1).toBeDefined();
		});
	});
});
