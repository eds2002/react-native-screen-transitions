import { describe, expect, it } from "bun:test";
import { determineSnapTarget } from "../providers/gestures/helpers/gesture-targets";

describe("determineSnapTarget", () => {
	const dimension = 800; // screen height
	const snapPoints = [0.3, 0.6, 1]; // 3 snap points

	describe("basic snapping without velocity", () => {
		it("snaps to nearest snap point when exactly at a snap point", () => {
			const result = determineSnapTarget({
				currentProgress: 0.6,
				snapPoints,
				velocity: 0,
				dimension,
			});
			expect(result.targetProgress).toBe(0.6);
			expect(result.shouldDismiss).toBe(false);
		});

		it("snaps to lower snap point when below midpoint", () => {
			// Midpoint between 0.3 and 0.6 is 0.45
			const result = determineSnapTarget({
				currentProgress: 0.4,
				snapPoints,
				velocity: 0,
				dimension,
			});
			expect(result.targetProgress).toBe(0.3);
		});

		it("snaps to higher snap point when above midpoint", () => {
			// Midpoint between 0.3 and 0.6 is 0.45
			const result = determineSnapTarget({
				currentProgress: 0.5,
				snapPoints,
				velocity: 0,
				dimension,
			});
			expect(result.targetProgress).toBe(0.6);
		});

		it("snaps to highest point when above all snap points", () => {
			const result = determineSnapTarget({
				currentProgress: 1.2,
				snapPoints,
				velocity: 0,
				dimension,
			});
			expect(result.targetProgress).toBe(1);
		});
	});

	describe("velocity influence", () => {
		it("velocity toward dismiss pushes toward lower snap point", () => {
			// At 0.5 (above midpoint 0.45), normally would snap to 0.6
			// But positive velocity (toward dismiss) should push toward 0.3
			const result = determineSnapTarget({
				currentProgress: 0.5,
				snapPoints,
				velocity: 800, // Strong velocity toward dismiss
				dimension,
				velocityFactor: 0.15,
			});
			expect(result.targetProgress).toBe(0.3);
		});

		it("velocity toward expand pushes toward higher snap point", () => {
			// At 0.4 (below midpoint 0.45), normally would snap to 0.3
			// But negative velocity (toward expand) should push toward 0.6
			const result = determineSnapTarget({
				currentProgress: 0.4,
				snapPoints,
				velocity: -800, // Strong velocity toward expand
				dimension,
				velocityFactor: 0.15,
			});
			expect(result.targetProgress).toBe(0.6);
		});

		it("weak velocity does not override position", () => {
			// At 0.55 (above midpoint), weak velocity shouldn't change target
			const result = determineSnapTarget({
				currentProgress: 0.55,
				snapPoints,
				velocity: 100, // Weak velocity
				dimension,
				velocityFactor: 0.15,
			});
			expect(result.targetProgress).toBe(0.6);
		});

		it("respects custom velocityFactor", () => {
			// Higher velocityFactor = velocity has more influence
			const result = determineSnapTarget({
				currentProgress: 0.5,
				snapPoints,
				velocity: 400,
				dimension,
				velocityFactor: 0.5, // High factor
			});
			expect(result.targetProgress).toBe(0.3);
		});
	});

	describe("dismiss behavior", () => {
		it("allows dismiss when canDismiss is true and near 0", () => {
			const result = determineSnapTarget({
				currentProgress: 0.1,
				snapPoints,
				velocity: 500,
				dimension,
				canDismiss: true,
			});
			expect(result.targetProgress).toBe(0);
			expect(result.shouldDismiss).toBe(true);
		});

		it("prevents dismiss when canDismiss is false", () => {
			const result = determineSnapTarget({
				currentProgress: 0.1,
				snapPoints,
				velocity: 1000, // Strong dismiss velocity
				dimension,
				canDismiss: false,
			});
			expect(result.targetProgress).toBe(0.3); // First snap point
			expect(result.shouldDismiss).toBe(false);
		});

		it("ignores zero snap points when canDismiss is false", () => {
			const result = determineSnapTarget({
				currentProgress: 0.1,
				snapPoints: [0, 0.3, 0.6, 1],
				velocity: 1000,
				dimension,
				canDismiss: false,
			});
			expect(result.targetProgress).toBe(0.3);
			expect(result.shouldDismiss).toBe(false);
		});

		it("defaults canDismiss to true", () => {
			const result = determineSnapTarget({
				currentProgress: 0.1,
				snapPoints,
				velocity: 500,
				dimension,
			});
			expect(result.shouldDismiss).toBe(true);
		});

		it("shouldDismiss is false when snapping to any snap point", () => {
			const result = determineSnapTarget({
				currentProgress: 0.5,
				snapPoints,
				velocity: 0,
				dimension,
			});
			expect(result.shouldDismiss).toBe(false);
		});
	});

	describe("edge cases", () => {
		it("returns current progress when no valid targets exist", () => {
			const result = determineSnapTarget({
				currentProgress: 0.42,
				snapPoints: [],
				velocity: 1200,
				dimension,
				canDismiss: false,
			});
			expect(result.targetProgress).toBe(0.42);
			expect(result.shouldDismiss).toBe(false);
		});

		it("handles single snap point", () => {
			const result = determineSnapTarget({
				currentProgress: 0.3,
				snapPoints: [0.5],
				velocity: 0,
				dimension,
			});
			expect(result.targetProgress).toBe(0.5);
		});

		it("handles unsorted snap points", () => {
			const result = determineSnapTarget({
				currentProgress: 0.5,
				snapPoints: [1, 0.3, 0.6], // Unsorted
				velocity: 0,
				dimension,
			});
			// After sorting: [0.3, 0.6, 1], midpoint 0.3-0.6 is 0.45
			expect(result.targetProgress).toBe(0.6);
		});

		it("handles progress at exactly 0", () => {
			const result = determineSnapTarget({
				currentProgress: 0,
				snapPoints,
				velocity: 0,
				dimension,
				canDismiss: true,
			});
			expect(result.targetProgress).toBe(0);
			expect(result.shouldDismiss).toBe(true);
		});

		it("handles negative progress", () => {
			const result = determineSnapTarget({
				currentProgress: -0.1,
				snapPoints,
				velocity: 0,
				dimension,
				canDismiss: true,
			});
			expect(result.targetProgress).toBe(0);
		});

		it("handles very high velocity", () => {
			const result = determineSnapTarget({
				currentProgress: 0.9,
				snapPoints,
				velocity: 5000, // Very high velocity
				dimension,
				velocityFactor: 0.15, // Higher factor to demonstrate velocity pushing far
				canDismiss: true,
			});
			expect(result.targetProgress).toBe(0);
			expect(result.shouldDismiss).toBe(true);
		});

		it("handles snap points not starting at typical values", () => {
			const result = determineSnapTarget({
				currentProgress: 0.7,
				snapPoints: [0.5, 0.75, 1],
				velocity: 0,
				dimension,
			});
			// Midpoint between 0.5 and 0.75 is 0.625
			// 0.7 is above 0.625, so should snap to 0.75
			expect(result.targetProgress).toBe(0.75);
		});

		it("handles two snap points", () => {
			const result = determineSnapTarget({
				currentProgress: 0.4,
				snapPoints: [0.3, 1],
				velocity: 0,
				dimension,
			});
			// Midpoint is 0.65, 0.4 is below, so snap to 0.3
			expect(result.targetProgress).toBe(0.3);
		});
	});

	describe("zone boundaries", () => {
		it("snaps to higher at exact midpoint (uses < not <=)", () => {
			// Midpoint between 0 and 0.3 is 0.15
			// The algorithm uses `<` so at exact midpoint, it snaps to higher
			const result = determineSnapTarget({
				currentProgress: 0.15,
				snapPoints,
				velocity: 0,
				dimension,
				canDismiss: true,
			});
			expect(result.targetProgress).toBe(0.3);
		});

		it("snaps to lower just below midpoint", () => {
			const result = determineSnapTarget({
				currentProgress: 0.149,
				snapPoints,
				velocity: 0,
				dimension,
				canDismiss: true,
			});
			expect(result.targetProgress).toBe(0);
		});

		it("snaps to higher just above midpoint", () => {
			const result = determineSnapTarget({
				currentProgress: 0.151,
				snapPoints,
				velocity: 0,
				dimension,
				canDismiss: true,
			});
			expect(result.targetProgress).toBe(0.3);
		});
	});
});
