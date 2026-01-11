import { describe, expect, it } from "bun:test";
import { validateSnapPoints } from "../utils/gesture/validate-snap-points";

describe("validateSnapPoints", () => {
	describe("when no snap points provided", () => {
		it("returns hasSnapPoints false", () => {
			const result = validateSnapPoints({});
			expect(result.hasSnapPoints).toBe(false);
		});

		it("returns empty snapPoints array", () => {
			const result = validateSnapPoints({});
			expect(result.snapPoints).toEqual([]);
		});

		it("returns -1 for min and max", () => {
			const result = validateSnapPoints({});
			expect(result.minSnapPoint).toBe(-1);
			expect(result.maxSnapPoint).toBe(-1);
		});

		it("handles undefined snapPoints", () => {
			const result = validateSnapPoints({ snapPoints: undefined });
			expect(result.hasSnapPoints).toBe(false);
		});
	});

	describe("when snap points provided", () => {
		it("returns hasSnapPoints true", () => {
			const result = validateSnapPoints({ snapPoints: [0.3, 0.6, 1] });
			expect(result.hasSnapPoints).toBe(true);
		});

		it("sorts snap points in ascending order", () => {
			const result = validateSnapPoints({ snapPoints: [1, 0.3, 0.6] });
			expect(result.snapPoints).toEqual([0.3, 0.6, 1]);
		});

		it("returns correct max snap point", () => {
			const result = validateSnapPoints({ snapPoints: [0.3, 0.6, 1] });
			expect(result.maxSnapPoint).toBe(1);
		});

		it("handles single snap point", () => {
			const result = validateSnapPoints({ snapPoints: [0.5] });
			expect(result.hasSnapPoints).toBe(true);
			expect(result.snapPoints).toEqual([0.5]);
			expect(result.minSnapPoint).toBe(0.5);
			expect(result.maxSnapPoint).toBe(0.5);
		});

		it("does not mutate original array", () => {
			const original = [1, 0.3, 0.6];
			validateSnapPoints({ snapPoints: original });
			expect(original).toEqual([1, 0.3, 0.6]);
		});
	});

	describe("canDismiss behavior", () => {
		it("sets minSnapPoint to 0 when canDismiss is true", () => {
			const result = validateSnapPoints({
				snapPoints: [0.3, 0.6, 1],
				canDismiss: true,
			});
			expect(result.minSnapPoint).toBe(0);
		});

		it("sets minSnapPoint to first snap point when canDismiss is false", () => {
			const result = validateSnapPoints({
				snapPoints: [0.3, 0.6, 1],
				canDismiss: false,
			});
			expect(result.minSnapPoint).toBe(0.3);
		});

		it("defaults canDismiss to falsy (minSnapPoint = first snap)", () => {
			const result = validateSnapPoints({ snapPoints: [0.3, 0.6, 1] });
			expect(result.minSnapPoint).toBe(0.3);
		});

		it("handles canDismiss with unsorted snap points", () => {
			const result = validateSnapPoints({
				snapPoints: [1, 0.5, 0.25],
				canDismiss: false,
			});
			// After sorting: [0.25, 0.5, 1]
			expect(result.minSnapPoint).toBe(0.25);
			expect(result.maxSnapPoint).toBe(1);
		});
	});

	describe("edge cases", () => {
		it("handles empty array", () => {
			const result = validateSnapPoints({ snapPoints: [] });
			// Empty array is falsy for snap points
			expect(result.hasSnapPoints).toBe(true); // Array exists but is empty
			expect(result.snapPoints).toEqual([]);
		});

		it("handles snap points at 0", () => {
			const result = validateSnapPoints({
				snapPoints: [0, 0.5, 1],
				canDismiss: true,
			});
			expect(result.minSnapPoint).toBe(0);
			expect(result.snapPoints).toEqual([0, 0.5, 1]);
		});

		it("handles duplicate snap points", () => {
			const result = validateSnapPoints({ snapPoints: [0.5, 0.5, 1] });
			expect(result.snapPoints).toEqual([0.5, 0.5, 1]);
		});

		it("handles very small snap point values", () => {
			const result = validateSnapPoints({ snapPoints: [0.01, 0.1, 0.5] });
			expect(result.minSnapPoint).toBe(0.01);
			expect(result.maxSnapPoint).toBe(0.5);
		});

		it("handles snap points greater than 1", () => {
			const result = validateSnapPoints({ snapPoints: [0.5, 1, 1.5] });
			expect(result.maxSnapPoint).toBe(1.5);
		});
	});
});
