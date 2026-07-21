import { describe, expect, it } from "bun:test";
import { resolveSheetScrollGestureBehavior } from "../utils/resolve-screen-transition-options";

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
});
