import { describe, expect, it } from "bun:test";
import { resolvePresentedIndex } from "../providers/stack/blank-stack-state/helpers/resolve-presented-index";
import type { BaseStackRoute } from "../types/stack.types";

const route = (key: string): BaseStackRoute => ({ key, name: key });

describe("presented stack focus", () => {
	it("keeps the current route focused while dismissal is undecided", () => {
		const routes = [route("welcome"), route("name")];

		expect(resolvePresentedIndex(routes, "name", new Set())).toBe(1);
	});

	it("focuses the previous route after dismissal commits", () => {
		const routes = [route("welcome"), route("name")];

		expect(resolvePresentedIndex(routes, "name", new Set(["name"]))).toBe(0);
	});

	it("skips multiple committed closing routes", () => {
		const routes = [route("A"), route("B"), route("C")];

		expect(resolvePresentedIndex(routes, "C", new Set(["B", "C"]))).toBe(0);
	});
});
