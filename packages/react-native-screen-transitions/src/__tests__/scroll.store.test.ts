import { beforeEach, describe, expect, it } from "bun:test";
import { ScrollStore } from "../stores/scroll.store";

const routeKey = "route-a";

beforeEach(() => {
	ScrollStore.clearBag(routeKey);
});

describe("ScrollStore metadata writers", () => {
	it("keeps the first writer for each axis", () => {
		expect(ScrollStore.claimMetadataWriter(routeKey, "vertical", "outer")).toBe(
			true,
		);
		expect(ScrollStore.claimMetadataWriter(routeKey, "vertical", "inner")).toBe(
			false,
		);
		expect(
			ScrollStore.claimMetadataWriter(routeKey, "horizontal", "child"),
		).toBe(true);
		expect(ScrollStore.hasMetadataWriters(routeKey)).toBe(true);
	});

	it("only releases the active writer", () => {
		ScrollStore.claimMetadataWriter(routeKey, "vertical", "outer");

		expect(
			ScrollStore.releaseMetadataWriter(routeKey, "vertical", "inner"),
		).toBe(false);
		expect(ScrollStore.hasMetadataWriters(routeKey)).toBe(true);

		expect(
			ScrollStore.releaseMetadataWriter(routeKey, "vertical", "outer"),
		).toBe(true);
		expect(ScrollStore.hasMetadataWriters(routeKey)).toBe(false);
	});
});
