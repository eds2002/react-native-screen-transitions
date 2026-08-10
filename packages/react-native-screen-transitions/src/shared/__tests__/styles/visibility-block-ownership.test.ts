import { describe, expect, it } from "bun:test";
import { resolveVisibilityBlockOwnership } from "../../providers/screen/styles/helpers/visibility-block-ownership";

describe("visibility block ownership", () => {
	it.each([
		[false, false, false, false],
		[true, false, true, true],
		[false, true, false, true],
		[true, true, false, true],
	] as const)(
		"local=%s ancestor=%s appliesOffset=%s effectiveBlocked=%s",
		(localBlocked, ancestorBlocked, appliesOffset, effectiveBlocked) => {
			expect(
				resolveVisibilityBlockOwnership({
					localBlocked,
					ancestorBlocked,
				}),
			).toEqual({ appliesOffset, effectiveBlocked });
		},
	);

	it("assigns one physical offset throughout a deeply blocked ancestry chain", () => {
		let ancestorBlocked = false;
		const ownership = [true, true, true, true].map((localBlocked) => {
			const current = resolveVisibilityBlockOwnership({
				localBlocked,
				ancestorBlocked,
			});
			ancestorBlocked = current.effectiveBlocked;
			return current;
		});

		expect(ownership.filter(({ appliesOffset }) => appliesOffset)).toHaveLength(1);
		expect(ownership.map(({ effectiveBlocked }) => effectiveBlocked)).toEqual([
			true,
			true,
			true,
			true,
		]);
	});

	it("hands offset ownership to the first locally blocked descendant", () => {
		let ancestorBlocked = false;
		const ownership = [false, false, true, true].map((localBlocked) => {
			const current = resolveVisibilityBlockOwnership({
				localBlocked,
				ancestorBlocked,
			});
			ancestorBlocked = current.effectiveBlocked;
			return current;
		});

		expect(ownership.map(({ appliesOffset }) => appliesOffset)).toEqual([
			false,
			false,
			true,
			false,
		]);
	});
});
