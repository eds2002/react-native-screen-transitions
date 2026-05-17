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

	it("returns self for depth 0", () => {
		const resolved = resolveChainTarget({
			target: { depth: 0 },
			self,
			ancestors,
		});

		expect(resolved).toBe(self);
	});

	it("returns parent for depth -1", () => {
		const resolved = resolveChainTarget({
			target: { depth: -1 },
			self,
			ancestors,
		});

		expect(resolved).toBe(parent);
	});

	it("returns root for depth -2", () => {
		const resolved = resolveChainTarget({
			target: { depth: -2 },
			self,
			ancestors,
		});

		expect(resolved).toBe(root);
	});

	it("returns null for positive depths because this resolver only walks ancestors", () => {
		const resolved = resolveChainTarget({
			target: { depth: 1 },
			self,
			ancestors,
		});

		expect(resolved).toBeNull();
	});

	it("returns null for missing ancestors", () => {
		const missingParent = resolveChainTarget({
			target: { depth: -1 },
			self,
			ancestors: [],
		});
		const outOfRange = resolveChainTarget({
			target: { depth: -10 },
			self,
			ancestors,
		});

		expect(missingParent).toBeNull();
		expect(outOfRange).toBeNull();
	});

	it("returns null for invalid depth values", () => {
		const nonInteger = resolveChainTarget({
			target: { depth: 1.5 },
			self,
			ancestors,
		});

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
