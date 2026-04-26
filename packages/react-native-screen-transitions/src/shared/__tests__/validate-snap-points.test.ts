import { describe, expect, it } from "bun:test";
import { validateSnapPoints } from "../providers/screen/gestures/helpers/validate-snap-points";

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
			expect(result.hasSnapPoints).toBe(false);
			expect(result.snapPoints).toEqual([]);
			expect(result.minSnapPoint).toBe(-1);
			expect(result.maxSnapPoint).toBe(-1);
		});

		it("handles snap points at 0", () => {
			const result = validateSnapPoints({
				snapPoints: [0, 0.5, 1],
				canDismiss: true,
			});
			expect(result.minSnapPoint).toBe(0);
			expect(result.snapPoints).toEqual([0, 0.5, 1]);
		});

		it("filters zero snap points when dismiss is disabled", () => {
			const result = validateSnapPoints({
				snapPoints: [0, 0.5, 1],
				canDismiss: false,
			});
			expect(result.snapPoints).toEqual([0.5, 1]);
			expect(result.minSnapPoint).toBe(0.5);
		});

		it("treats all-zero snap points as disabled when dismiss is disabled", () => {
			const result = validateSnapPoints({
				snapPoints: [0],
				canDismiss: false,
			});
			expect(result.hasSnapPoints).toBe(false);
			expect(result.snapPoints).toEqual([]);

			expect(result.minSnapPoint).toBe(-1);
			expect(result.maxSnapPoint).toBe(-1);
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

	describe("'auto' snap point", () => {
		it("returns hasSnapPoints true for ['auto']", () => {
			const result = validateSnapPoints({ snapPoints: ["auto"] });
			expect(result.hasSnapPoints).toBe(true);
		});

		it("sets hasAutoSnapPoint true when 'auto' is present", () => {
			const result = validateSnapPoints({ snapPoints: ["auto"] });
			expect(result.hasAutoSnapPoint).toBe(true);
		});

		it("sets hasAutoSnapPoint false when no 'auto' is present", () => {
			const result = validateSnapPoints({ snapPoints: [0.5, 1] });
			expect(result.hasAutoSnapPoint).toBe(false);
		});

		it("excludes 'auto' from the numeric snapPoints array", () => {
			const result = validateSnapPoints({ snapPoints: ["auto"] });
			expect(result.snapPoints).toEqual([]);
		});

		it("returns -1 for min and max when only 'auto' is present", () => {
			const result = validateSnapPoints({ snapPoints: ["auto"] });
			expect(result.minSnapPoint).toBe(-1);
			expect(result.maxSnapPoint).toBe(-1);
		});

		it("includes numeric points alongside 'auto'", () => {
			const result = validateSnapPoints({ snapPoints: ["auto", 1.0] });
			expect(result.hasSnapPoints).toBe(true);
			expect(result.hasAutoSnapPoint).toBe(true);
			expect(result.snapPoints).toEqual([1.0]);
			expect(result.maxSnapPoint).toBe(1.0);
		});

		it("sorts numeric points and excludes 'auto' from the array", () => {
			const result = validateSnapPoints({ snapPoints: [1.0, "auto", 0.5] });
			expect(result.snapPoints).toEqual([0.5, 1.0]);
			expect(result.hasAutoSnapPoint).toBe(true);
		});

		it("sets minSnapPoint to 0 when canDismiss and 'auto' is the only point", () => {
			const result = validateSnapPoints({
				snapPoints: ["auto"],
				canDismiss: true,
			});
			expect(result.minSnapPoint).toBe(0);
		});

		it("does not mutate original array containing 'auto'", () => {
			const original: ("auto" | number)[] = [1, "auto", 0.5];
			validateSnapPoints({ snapPoints: original });
			expect(original).toEqual([1, "auto", 0.5]);
		});
	});
});
