import { describe, expect, it } from "bun:test";
import { syncRoutesWithRemoved } from "../utils/navigation/sync-routes-with-removed";

const createRoute = (key: string) => ({ key });
const createClosingRouteKeys = () => new Set<string>();

describe("syncRoutesWithRemoved", () => {
	describe("basic routing", () => {
		it("returns empty routes when nextRoutes is empty", () => {
			const closingRouteKeys = createClosingRouteKeys();
			const result = syncRoutesWithRemoved({
				prevRoutes: [createRoute("a")],
				prevDescriptors: {},
				nextRoutes: [],
				nextDescriptors: {},
				closingRouteKeys,
			});
			expect(result.routes).toEqual([]);
		});

		it("returns nextRoutes unchanged for normal push (A -> B)", () => {
			const closingRouteKeys = createClosingRouteKeys();
			const result = syncRoutesWithRemoved({
				prevRoutes: [createRoute("a")],
				prevDescriptors: { a: {} },
				nextRoutes: [createRoute("a"), createRoute("b")],
				nextDescriptors: { a: {}, b: {} },
				closingRouteKeys,
			});
			expect(result.routes.map((r) => r.key)).toEqual(["a", "b"]);
		});

		it("returns nextRoutes unchanged for normal stack (A -> B -> C)", () => {
			const closingRouteKeys = createClosingRouteKeys();

			const result = syncRoutesWithRemoved({
				prevRoutes: [createRoute("a"), createRoute("b")],
				prevDescriptors: { a: {}, b: {} },
				nextRoutes: [createRoute("a"), createRoute("b"), createRoute("c")],
				nextDescriptors: { a: {}, b: {}, c: {} },
				closingRouteKeys,
			});
			expect(result.routes.map((r) => r.key)).toEqual(["a", "b", "c"]);
		});
	});
	describe("normal back navigation", () => {
		it("keeps closing route at end for normal back (C -> B)", () => {
			const closingRouteKeys = createClosingRouteKeys();

			const result = syncRoutesWithRemoved({
				prevRoutes: [createRoute("a"), createRoute("b"), createRoute("c")],
				prevDescriptors: { a: {}, b: {}, c: {} },
				nextRoutes: [createRoute("a"), createRoute("b")],
				nextDescriptors: { a: {}, b: {} },
				closingRouteKeys,
			});

			// c should be added to end for close animation
			expect(result.routes.map((r) => r.key)).toEqual(["a", "b", "c"]);
			expect(closingRouteKeys.has("c")).toBe(true);
		});
	});
});
