import { describe, expect, it } from "bun:test";
import type { ScreenTransitionState } from "../types/animation.types";
import { derivations } from "../utils/animation/derivations";

const createMockState = (
	overrides: Partial<ScreenTransitionState> = {},
): ScreenTransitionState => ({
	progress: 1,
	closing: 0,
	animating: 0,
	entering: 1,
	gesture: {
		isDragging: 0,
		x: 0,
		y: 0,
		normalizedX: 0,
		normalizedY: 0,
		isDismissing: 0,
		direction: null,
	},
	route: { key: "test-route", name: "TestScreen" } as any,
	...overrides,
});

describe("derivations", () => {
	describe("progress", () => {
		it("returns current progress when no next screen", () => {
			const result = derivations({
				current: createMockState({ progress: 0.5 }),
			});
			expect(result.progress).toBe(0.5);
		});

		it("combines current + next progress (0-2 range)", () => {
			const result = derivations({
				current: createMockState({ progress: 1 }),
				next: createMockState({ progress: 0.5 }),
			});
			expect(result.progress).toBe(1.5);
		});

		it("returns 2 when both screens fully transitioned", () => {
			const result = derivations({
				current: createMockState({ progress: 1 }),
				next: createMockState({ progress: 1 }),
			});
			expect(result.progress).toBe(2);
		});
	});

	describe("focused", () => {
		it("returns true when no next screen", () => {
			const result = derivations({
				current: createMockState(),
			});
			expect(result.focused).toBe(true);
		});

		it("returns false when next screen exists", () => {
			const result = derivations({
				current: createMockState(),
				next: createMockState(),
			});
			expect(result.focused).toBe(false);
		});
	});

	describe("active", () => {
		it("returns current when focused (no next)", () => {
			const current = createMockState({ progress: 0.3 });
			const result = derivations({ current });
			expect(result.active).toBe(current);
		});

		it("returns next when not focused", () => {
			const current = createMockState({ progress: 1 });
			const next = createMockState({ progress: 0.5 });
			const result = derivations({ current, next });
			expect(result.active).toBe(next);
		});
	});

	describe("isActiveTransitioning", () => {
		it("returns true when active screen is dragging", () => {
			const result = derivations({
				current: createMockState({
					gesture: {
						isDragging: 1,
						x: 0,
						y: 0,
						normalizedX: 0,
						normalizedY: 0,
						isDismissing: 0,
						direction: null,
					},
				}),
			});
			expect(result.isActiveTransitioning).toBe(true);
		});

		it("returns true when active screen is animating", () => {
			const result = derivations({
				current: createMockState({ animating: 1 }),
			});
			expect(result.isActiveTransitioning).toBe(true);
		});

		it("returns false when not dragging or animating", () => {
			const result = derivations({
				current: createMockState({ animating: 0 }),
			});
			expect(result.isActiveTransitioning).toBe(false);
		});
	});

	describe("isDismissing", () => {
		it("returns true when gesture isDismissing", () => {
			const result = derivations({
				current: createMockState({
					gesture: {
						isDragging: 0,
						x: 0,
						y: 0,
						normalizedX: 0,
						normalizedY: 0,
						isDismissing: 1,
						direction: null,
					},
				}),
			});
			expect(result.isDismissing).toBe(true);
		});

		it("returns true when closing flag is set", () => {
			const result = derivations({
				current: createMockState({ closing: 1 }),
			});
			expect(result.isDismissing).toBe(true);
		});

		it("returns false when not dismissing or closing", () => {
			const result = derivations({
				current: createMockState(),
			});
			expect(result.isDismissing).toBe(false);
		});

		it("checks active screen (next) for dismissing state", () => {
			const result = derivations({
				current: createMockState(),
				next: createMockState({ closing: 1 }),
			});
			expect(result.isDismissing).toBe(true);
		});
	});
});
