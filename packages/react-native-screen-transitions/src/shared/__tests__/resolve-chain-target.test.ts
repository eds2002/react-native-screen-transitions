import { describe, expect, it } from "bun:test";
import { resolveChainTarget } from "../utils/resolve-chain-target";

describe("resolveChainTarget", () => {
	const root = { label: "root" };
	const parent = { label: "parent" };
	const self = { label: "self" };
	const ancestors = [parent, root];

	it("returns self for the default target", () => {
		const resolved = resolveChainTarget({
			target: undefined,
			self,
			ancestors,
		});

		expect(resolved).toBe(self);
	});

	it("returns self for an explicit self target", () => {
		const resolved = resolveChainTarget({
			target: "self",
			self,
			ancestors,
		});

		expect(resolved).toBe(self);
	});

	it("returns parent when requested", () => {
		const resolved = resolveChainTarget({
			target: "parent",
			self,
			ancestors,
		});

		expect(resolved).toBe(parent);
	});

	it("returns root when requested", () => {
		const resolved = resolveChainTarget({
			target: "root",
			self,
			ancestors,
		});

		expect(resolved).toBe(root);
	});

	it("resolves an explicit ancestor depth", () => {
		const resolved = resolveChainTarget({
			target: { ancestor: 2 },
			self,
			ancestors,
		});

		expect(resolved).toBe(root);
	});

	it("returns null for missing ancestors", () => {
		const missingParent = resolveChainTarget({
			target: "parent",
			self,
			ancestors: [],
		});
		const outOfRange = resolveChainTarget({
			target: { ancestor: 10 },
			self,
			ancestors,
		});

		expect(missingParent).toBeNull();
		expect(outOfRange).toBeNull();
	});

	it("returns null for invalid ancestor values", () => {
		const zero = resolveChainTarget({
			target: { ancestor: 0 },
			self,
			ancestors,
		});
		const negative = resolveChainTarget({
			target: { ancestor: -1 },
			self,
			ancestors,
		});
		const nonInteger = resolveChainTarget({
			target: { ancestor: 1.5 },
			self,
			ancestors,
		});

		expect(zero).toBeNull();
		expect(negative).toBeNull();
		expect(nonInteger).toBeNull();
	});

	it("returns null when self is unavailable", () => {
		const resolved = resolveChainTarget({
			target: undefined,
			self: null,
			ancestors,
		});

		expect(resolved).toBeNull();
	});
});
