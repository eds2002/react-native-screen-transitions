import { describe, expect, it } from "bun:test";
import { getStackRoutes } from "../utils/navigation/get-stack-routes";

const route = (key: string) => ({ key, name: key });

describe("getStackRoutes", () => {
	it("reads preloaded routes from `preloadedRoutes`", () => {
		const routes = [route("a"), route("b")];
		const preloadedRoutes = [route("preloaded")];

		const result = getStackRoutes({ index: 1, routes, preloadedRoutes });

		expect(result.routes).toBe(routes);
		expect(result.preloadedRoutes).toBe(preloadedRoutes);
	});

	it("returns no preloaded routes when the state has none", () => {
		const routes = [route("a")];

		expect(getStackRoutes({ index: 0, routes })).toEqual({
			routes,
			preloadedRoutes: [],
		});
	});

	it("splits preloaded routes that follow the focused route", () => {
		const a = route("a");
		const b = route("b");
		const preloaded = { ...route("preloaded"), isPreloaded: true };

		const result = getStackRoutes({ index: 1, routes: [a, b, preloaded] });

		expect(result.routes).toEqual([a, b]);
		expect(result.preloadedRoutes).toEqual([preloaded]);
	});
});
