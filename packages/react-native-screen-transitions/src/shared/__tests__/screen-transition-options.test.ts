import { describe, expect, it } from "bun:test";
import {
	resolveNavigationMaskEnabled,
	resolveSheetScrollGestureBehavior,
} from "../utils/resolve-screen-transition-options";

describe("screen transition option aliases", () => {
	it("defaults sheet scroll gesture behavior to expand-and-collapse", () => {
		expect(resolveSheetScrollGestureBehavior({})).toBe(
			"expand-and-collapse",
		);
	});

	it("maps deprecated expandViaScrollView aliases onto the new enum", () => {
		expect(
			resolveSheetScrollGestureBehavior({ expandViaScrollView: true }),
		).toBe("expand-and-collapse");
		expect(
			resolveSheetScrollGestureBehavior({ expandViaScrollView: false }),
		).toBe("collapse-only");
	});

	it("prefers sheetScrollGestureBehavior over the deprecated boolean alias", () => {
		expect(
			resolveSheetScrollGestureBehavior({
				sheetScrollGestureBehavior: "collapse-only",
				expandViaScrollView: true,
			}),
		).toBe("collapse-only");
	});

	it("defaults navigationMaskEnabled to false", () => {
		expect(resolveNavigationMaskEnabled({})).toBe(false);
	});

	it("falls back to deprecated maskEnabled when needed", () => {
		expect(resolveNavigationMaskEnabled({ maskEnabled: true })).toBe(true);
		expect(resolveNavigationMaskEnabled({ maskEnabled: false })).toBe(false);
	});

	it("prefers navigationMaskEnabled over deprecated maskEnabled", () => {
		expect(
			resolveNavigationMaskEnabled({
				navigationMaskEnabled: false,
				maskEnabled: true,
			}),
		).toBe(false);
	});
});
