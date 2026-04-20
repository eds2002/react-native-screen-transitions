import { describe, expect, it } from "bun:test";
import { toPlainRoute, toPlainValue } from "../utils/navigation/to-plain-route";

const createNullPrototypeParams = () => {
	const nested = Object.create(null) as Record<string, unknown>;
	nested.slug = "alpha";

	const listItem = Object.create(null) as Record<string, unknown>;
	listItem.id = 1;

	const params = Object.create(null) as Record<string, unknown>;
	params.title = "Deep Link";
	params.nested = nested;
	params.items = [listItem];

	return params as object;
};

describe("toPlainValue", () => {
	it("normalizes null-prototype deep-link payloads into plain objects", () => {
		const params = createNullPrototypeParams() as Record<string, unknown>;

		const normalized = toPlainValue(params) as Record<string, unknown>;
		const normalizedNested = normalized.nested as Record<string, unknown>;
		const normalizedListItem = (
			normalized.items as Array<Record<string, unknown>>
		)[0];

		expect(normalized).not.toBe(params);
		expect(Object.getPrototypeOf(normalized)).toBe(Object.prototype);
		expect(Object.getPrototypeOf(normalizedNested)).toBe(Object.prototype);
		expect(Array.isArray(normalized.items)).toBe(true);
		expect(Object.getPrototypeOf(normalizedListItem)).toBe(Object.prototype);
		expect(normalized.title).toBe("Deep Link");
		expect(normalizedNested.slug).toBe("alpha");
		expect(normalizedListItem.id).toBe(1);
	});
});

describe("toPlainRoute", () => {
	it("preserves route identity fields while normalizing params", () => {
		const params = createNullPrototypeParams();
		const route = {
			key: "route-key",
			name: "route-name",
			params,
		};

		const normalized = toPlainRoute(route);

		expect(normalized.key).toBe(route.key);
		expect(normalized.name).toBe(route.name);
		expect(normalized.params).not.toBe(params);
		expect(Object.getPrototypeOf(normalized.params)).toBe(Object.prototype);
	});
});
