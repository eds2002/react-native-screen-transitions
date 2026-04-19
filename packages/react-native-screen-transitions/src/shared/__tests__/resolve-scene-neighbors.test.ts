import { describe, expect, it } from "bun:test";
import { resolveSceneNeighbors } from "../utils/navigation/resolve-scene-neighbors";

const createScene = (key: string) => ({
	route: { key },
	descriptor: { id: key },
});

describe("resolveSceneNeighbors", () => {
	it("returns direct neighbors when no routes are closing", () => {
		const scenes = [createScene("a"), createScene("b"), createScene("c")];
		const isRouteClosing = () => false;

		const result = resolveSceneNeighbors(scenes, 1, isRouteClosing);

		expect(result.previousDescriptor).toEqual({ id: "a" });
		expect(result.nextDescriptor).toEqual({ id: "c" });
	});

	it("isolates closing current scene", () => {
		const scenes = [createScene("a"), createScene("b"), createScene("c")];
		const isRouteClosing = (routeKey: string) => routeKey === "b";

		const result = resolveSceneNeighbors(scenes, 1, isRouteClosing);

		expect(result.previousDescriptor).toBeUndefined();
		expect(result.nextDescriptor).toBeUndefined();
	});

	it("skips closing route above and links to active next", () => {
		const scenes = [
			createScene("a"),
			createScene("b-closing"),
			createScene("c"),
		];
		const isRouteClosing = (routeKey: string) => routeKey === "b-closing";

		const result = resolveSceneNeighbors(scenes, 0, isRouteClosing);

		expect(result.previousDescriptor).toBeUndefined();
		expect(result.nextDescriptor).toEqual({ id: "c" });
	});

	it("falls back to closing route above when it is the only next route", () => {
		const scenes = [createScene("a"), createScene("b-closing")];
		const isRouteClosing = (routeKey: string) => routeKey === "b-closing";

		const result = resolveSceneNeighbors(scenes, 0, isRouteClosing);

		expect(result.nextDescriptor).toEqual({ id: "b-closing" });
	});

	it("handles push during dismiss shape [A, B1(closing), B2]", () => {
		const scenes = [createScene("a"), createScene("b1"), createScene("b2")];
		const isRouteClosing = (routeKey: string) => routeKey === "b1";

		const forA = resolveSceneNeighbors(scenes, 0, isRouteClosing);
		const forB2 = resolveSceneNeighbors(scenes, 2, isRouteClosing);

		expect(forA.nextDescriptor).toEqual({ id: "b2" });
		expect(forB2.previousDescriptor).toEqual({ id: "a" });
	});
});
