import { describe, expect, it } from "bun:test";
import { findCollapseTarget } from "../utils/gesture/find-collapse-target";

describe("findCollapseTarget", () => {
	it("returns the next lower snap point when one exists", () => {
		const result = findCollapseTarget(0.8, [0.3, 0.6, 1], true);
		expect(result).toEqual({ target: 0.6, shouldDismiss: false });
	});

	it("dismisses at min snap when dismiss is allowed", () => {
		const result = findCollapseTarget(0.3, [0.3, 0.6, 1], true);
		expect(result).toEqual({ target: 0, shouldDismiss: true });
	});

	it("stays at min snap when dismiss is not allowed", () => {
		const result = findCollapseTarget(0.3, [0.3, 0.6, 1], false);
		expect(result).toEqual({ target: 0.3, shouldDismiss: false });
	});

	it("ignores zero snap points when dismiss is disabled", () => {
		const result = findCollapseTarget(0.6, [0, 0.3, 0.6, 1], false);
		expect(result).toEqual({ target: 0.3, shouldDismiss: false });
	});

	it("does not collapse to zero when only zero snap remains and dismiss disabled", () => {
		const result = findCollapseTarget(0.5, [0], false);
		expect(result).toEqual({ target: 0.5, shouldDismiss: false });
	});

	it("falls back to dismiss when no valid snaps remain and dismiss enabled", () => {
		const result = findCollapseTarget(0.5, [Number.NaN], true);
		expect(result).toEqual({ target: 0, shouldDismiss: true });
	});
});
