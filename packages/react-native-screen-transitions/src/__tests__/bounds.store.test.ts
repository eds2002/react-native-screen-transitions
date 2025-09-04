import { beforeEach, describe, expect, it } from "bun:test";
import { resolveActiveBound } from "../stores/bounds/_utils";
import type { ScreenTransitionState } from "../types/animation";

type Dim = {
	x: number;
	y: number;
	pageX: number;
	pageY: number;
	width: number;
	height: number;
};

const getDimensions = (x = 0, y = 0, w = 100, h = 100): Dim => ({
	x,
	y,
	pageX: x,
	pageY: y,
	width: w,
	height: h,
});

const mockState = (
	routeKey: string,
	ids: string[] = [],
): ScreenTransitionState => {
	const bounds: Record<
		string,
		{ bounds: Dim; styles: Record<string, unknown> }
	> = {};
	ids.forEach((id, i) => {
		bounds[id] = { bounds: getDimensions(i * 10, i * 10), styles: {} };
	});
	return {
		progress: 1,
		closing: 0,
		animating: 1,
		gesture: {
			x: 0,
			y: 0,
			normalizedX: 0,
			normalizedY: 0,
			isDismissing: 0,
			isDragging: 0,
		},
		bounds,
		// @ts-expect-error partial route
		route: { key: routeKey },
	};
};

let cache: Record<string, string>;
beforeEach(() => {
	cache = {};
});

const getPairCache = (from: string, to: string) =>
	cache[`${from}|${to}`] ?? null;
const setPairCache = (from: string, to: string, id: string) => {
	cache[`${from}|${to}`] = id;
};

const getRouteActive = (_routeKey: string) => null;

describe("Bounds.getActiveBound - requested id priority and acceptance", () => {
	it("selects requested id when present only on current (opening)", () => {
		const A = "A-1";
		const B = "B-1";
		const current = mockState(A, ["container"]);
		const previous = mockState(B, ["icon"]);

		const active = resolveActiveBound({
			current,
			previous,
			requestedId: "container",
			getPairCache,
			setPairCache,
			getRouteActive,
		});

		expect(active).toBe("container");
		expect(getPairCache(B, A)).toBeNull();
	});

	it("selects requested id when present only on other (closing)", () => {
		const A = "A-2";
		const B = "B-2";
		const current = mockState(A, ["icon"]);
		const next = mockState(B, ["container"]);

		const active = resolveActiveBound({
			current,
			next,
			requestedId: "container",
			getPairCache,
			setPairCache,
			getRouteActive,
		});
		expect(active).toBe("container");
		expect(getPairCache(A, B)).toBeNull();
	});
});

describe("Bounds.getActiveBound - hint behavior (guarded writes)", () => {
	it("writes hint only when both sides have the id", () => {
		const A = "A-3";
		const B = "B-3";
		// Both have the same id measured
		const current = mockState(A, ["container"]);
		const previous = mockState(B, ["container"]);

		const active = resolveActiveBound({
			current,
			previous,
			requestedId: "container",
			getPairCache,
			setPairCache,
			getRouteActive,
		});
		expect(active).toBe("container");
		expect(getPairCache(B, A)).toBe("container");
	});

	it("requested id overrides existing hint and updates it when both sides measured", () => {
		const A = "A-4";
		const B = "B-4";
		// Both sides have icon and container
		// Pre-seed a conflicting hint
		setPairCache(B, A, "icon");

		const current = mockState(A, ["icon", "container"]);
		const previous = mockState(B, ["icon", "container"]);

		const active = resolveActiveBound({
			current,
			previous,
			requestedId: "container",
			getPairCache,
			setPairCache,
			getRouteActive,
		});
		expect(active).toBe("container");
		expect(getPairCache(B, A)).toBe("container");
	});
});

describe("Bounds.getActiveBound - set intersection and fallbacks", () => {
	it("falls back to intersection when no request or hint", () => {
		const A = "A-5";
		const B = "B-5";
		const current = mockState(A, ["alpha", "beta"]);
		const previous = mockState(B, ["beta", "gamma"]);

		const active = resolveActiveBound({
			current,
			previous,
			requestedId: null,
			getPairCache,
			setPairCache,
			getRouteActive,
		});
		expect(active).toBe("beta");
	});

	it("when other has a single bound, selects it (no request/hint)", () => {
		const A = "A-6";
		const B = "B-6";
		const current = mockState(A, ["alpha"]);
		const previous = mockState(B, ["only"]);

		const active = resolveActiveBound({
			current,
			previous,
			requestedId: null,
			getPairCache,
			setPairCache,
			getRouteActive,
		});
		expect(active).toBe("only");
	});
});
