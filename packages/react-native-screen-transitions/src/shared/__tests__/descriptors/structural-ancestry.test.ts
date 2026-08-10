import { describe, expect, it } from "bun:test";
import { deriveStructuralAncestorKeys } from "../../providers/screen/descriptors/helpers/derive-structural-ancestor-keys";

describe("structural descriptor ancestry", () => {
	it("preserves the mounted parent chain when another sibling is focused", () => {
		expect(
			deriveStructuralAncestorKeys({
				currentScreenKey: "nested-1",
				ancestorKeys: ["example-3"],
			}),
		).toEqual(["nested-1", "example-3"]);
	});

	it("returns no ancestors at the root", () => {
		expect(deriveStructuralAncestorKeys(null)).toEqual([]);
	});
});
