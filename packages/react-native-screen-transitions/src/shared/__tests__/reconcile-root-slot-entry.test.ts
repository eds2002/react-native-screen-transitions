import { describe, expect, it } from "bun:test";
import {
	reconcileRootSlotProps,
	reconcileRootSlotStyle,
} from "../utils/reconcile-root-slot-entry";

describe("reconcileRootSlotStyle", () => {
	it("holds the last resolved style while the transition is still in flight", () => {
		const result = reconcileRootSlotStyle({
			current: undefined,
			previousKeys: {
				borderRadius: true,
				transform: true,
			},
			lastResolved: {
				borderRadius: 24,
				transform: [{ translateX: 12 }],
			},
			isTransitionInFlight: true,
		});

		expect(result.value).toEqual({
			borderRadius: 24,
			transform: [{ translateX: 12 }],
		});
		expect(result.nextKeys).toEqual({
			borderRadius: true,
			transform: true,
		});
		expect(result.nextLastResolved).toEqual({
			borderRadius: 24,
			transform: [{ translateX: 12 }],
		});
	});

	it("emits an explicit unset patch once the transition is idle", () => {
		const result = reconcileRootSlotStyle({
			current: undefined,
			previousKeys: {
				borderRadius: true,
				overflow: true,
				transform: true,
				zIndex: true,
			},
			lastResolved: {
				borderRadius: 24,
				overflow: "hidden",
				transform: [{ translateX: 12 }],
				zIndex: 10,
			},
			isTransitionInFlight: false,
		});

		expect(result.value).toEqual({
			borderRadius: undefined,
			overflow: undefined,
			transform: [
				{ translateX: 0 },
				{ translateY: 0 },
				{ scaleX: 1 },
				{ scaleY: 1 },
			],
			zIndex: 0,
		});
		expect(result.nextKeys).toEqual({});
		expect(result.nextLastResolved).toBeNull();
	});
});

describe("reconcileRootSlotProps", () => {
	it("clears missing props after the transition completes", () => {
		const result = reconcileRootSlotProps({
			current: {
				intensity: 80,
			},
			previousKeys: {
				intensity: true,
				tint: true,
			},
			lastResolved: {
				intensity: 50,
				tint: "dark",
			},
			isTransitionInFlight: false,
		});

		expect(result.value).toEqual({
			intensity: 80,
			tint: undefined,
		});
		expect(result.nextKeys).toEqual({
			intensity: true,
		});
		expect(result.nextLastResolved).toEqual({
			intensity: 80,
		});
	});
});
