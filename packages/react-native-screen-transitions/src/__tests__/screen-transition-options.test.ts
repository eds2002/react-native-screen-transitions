import { describe, expect, it } from "bun:test";
import { resolveSheetScrollGestureBehavior } from "../utils/resolve-screen-transition-options";

describe("screen transition options", () => {
	it("defaults sheet scroll gesture behavior to expand-and-collapse", () => {
		expect(resolveSheetScrollGestureBehavior({})).toBe(
			"expand-and-collapse",
		);
	});

	it("uses the configured sheet scroll behavior", () => {
		expect(
			resolveSheetScrollGestureBehavior({
				sheetScrollGestureBehavior: "collapse-only",
			}),
		).toBe("collapse-only");
	});
});
