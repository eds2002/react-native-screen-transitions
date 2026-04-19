import { describe, expect, it } from "bun:test";
import type { DerivedValue } from "react-native-reanimated";
import { resolveScreenAnimationTarget } from "../providers/screen/animation/helpers/resolve-screen-animation-target";
import type { ScreenInterpolationProps } from "../types/animation.types";

const createDerivedValue = (
	label: string,
): DerivedValue<ScreenInterpolationProps> =>
	({ value: label } as unknown as DerivedValue<ScreenInterpolationProps>);

describe("resolveScreenAnimationTarget", () => {
	const self = createDerivedValue("self");
	const parent = createDerivedValue("parent");
	const grandparent = createDerivedValue("grandparent");
	const greatGrandparent = createDerivedValue("great-grandparent");
	const ancestors = [parent, grandparent, greatGrandparent];

	it("returns self by default", () => {
		const resolved = resolveScreenAnimationTarget({
			target: undefined,
			self,
			ancestors,
		});

		expect(resolved).toBe(self);
	});

	it("returns parent when requested", () => {
		const resolved = resolveScreenAnimationTarget({
			target: "parent",
			self,
			ancestors,
		});

		expect(resolved).toBe(parent);
	});

	it("returns root ancestor when requested", () => {
		const resolved = resolveScreenAnimationTarget({
			target: "root",
			self,
			ancestors,
		});

		expect(resolved).toBe(greatGrandparent);
	});

	it("resolves explicit ancestor depth", () => {
		const resolved = resolveScreenAnimationTarget({
			target: { ancestor: 2 },
			self,
			ancestors,
		});

		expect(resolved).toBe(grandparent);
	});

	it("falls back to self for out-of-range ancestor depth", () => {
		const resolved = resolveScreenAnimationTarget({
			target: { ancestor: 10 },
			self,
			ancestors,
		});

		expect(resolved).toBe(self);
	});

	it("falls back to self when there is no parent", () => {
		const resolved = resolveScreenAnimationTarget({
			target: "parent",
			self,
			ancestors: [],
		});

		expect(resolved).toBe(self);
	});

	it("falls back to self for invalid ancestor values", () => {
		const zero = resolveScreenAnimationTarget({
			target: { ancestor: 0 },
			self,
			ancestors,
		});
		const negative = resolveScreenAnimationTarget({
			target: { ancestor: -1 },
			self,
			ancestors,
		});
		const nonInteger = resolveScreenAnimationTarget({
			target: { ancestor: 1.5 },
			self,
			ancestors,
		});

		expect(zero).toBe(self);
		expect(negative).toBe(self);
		expect(nonInteger).toBe(self);
	});
});
