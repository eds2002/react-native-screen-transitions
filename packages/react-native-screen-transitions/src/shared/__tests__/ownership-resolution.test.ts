import { describe, expect, it } from "bun:test";
import type { ClaimedDirections } from "../types/ownership.types";
import { NO_CLAIMS } from "../types/ownership.types";
import {
	claimsAnyDirection,
	computeClaimedDirections,
} from "../utils/gesture/compute-claimed-directions";
import {
	type AncestorClaimsContext,
	resolveOwnership,
} from "../utils/gesture/resolve-ownership";

/**
 * Helper to create a mock context chain for testing.
 */
function createContext(
	claims: ClaimedDirections,
	parent: AncestorClaimsContext | null = null,
): AncestorClaimsContext {
	return {
		claimedDirections: claims,
		ancestorContext: parent,
	};
}

/**
 * Helper to create claims from a simple list of directions.
 */
function claims(...directions: string[]): ClaimedDirections {
	return {
		vertical: directions.includes("vertical"),
		"vertical-inverted": directions.includes("vertical-inverted"),
		horizontal: directions.includes("horizontal"),
		"horizontal-inverted": directions.includes("horizontal-inverted"),
	};
}

describe("computeClaimedDirections", () => {
	it("returns NO_CLAIMS when gestureEnabled is false", () => {
		const result = computeClaimedDirections(false, "vertical", false);
		expect(result).toEqual(NO_CLAIMS);
	});

	it("defaults to vertical when gestureDirection is undefined", () => {
		const result = computeClaimedDirections(true, undefined, false);
		expect(result.vertical).toBe(true);
		expect(result["vertical-inverted"]).toBe(false);
		expect(result.horizontal).toBe(false);
		expect(result["horizontal-inverted"]).toBe(false);
	});

	it("handles single direction", () => {
		const result = computeClaimedDirections(true, "horizontal", false);
		expect(result.vertical).toBe(false);
		expect(result["vertical-inverted"]).toBe(false);
		expect(result.horizontal).toBe(true);
		expect(result["horizontal-inverted"]).toBe(false);
	});

	it("handles array of directions", () => {
		const result = computeClaimedDirections(
			true,
			["vertical", "horizontal"],
			false,
		);
		expect(result.vertical).toBe(true);
		expect(result["vertical-inverted"]).toBe(false);
		expect(result.horizontal).toBe(true);
		expect(result["horizontal-inverted"]).toBe(false);
	});

	it("handles bidirectional", () => {
		const result = computeClaimedDirections(true, "bidirectional", false);
		expect(result.vertical).toBe(true);
		expect(result["vertical-inverted"]).toBe(true);
		expect(result.horizontal).toBe(true);
		expect(result["horizontal-inverted"]).toBe(true);
	});

	it("snap points claim both directions on vertical axis", () => {
		const result = computeClaimedDirections(true, "vertical", true);
		expect(result.vertical).toBe(true);
		expect(result["vertical-inverted"]).toBe(true);
		expect(result.horizontal).toBe(false);
		expect(result["horizontal-inverted"]).toBe(false);
	});

	it("snap points claim both directions on horizontal axis", () => {
		const result = computeClaimedDirections(true, "horizontal", true);
		expect(result.vertical).toBe(false);
		expect(result["vertical-inverted"]).toBe(false);
		expect(result.horizontal).toBe(true);
		expect(result["horizontal-inverted"]).toBe(true);
	});

	it("snap points with vertical-inverted claim both vertical directions", () => {
		const result = computeClaimedDirections(true, "vertical-inverted", true);
		expect(result.vertical).toBe(true);
		expect(result["vertical-inverted"]).toBe(true);
	});
});

describe("claimsAnyDirection", () => {
	it("returns false for NO_CLAIMS", () => {
		expect(claimsAnyDirection(NO_CLAIMS)).toBe(false);
	});

	it("returns true if any direction is claimed", () => {
		expect(claimsAnyDirection(claims("vertical"))).toBe(true);
		expect(claimsAnyDirection(claims("horizontal-inverted"))).toBe(true);
	});
});

describe("resolveOwnership", () => {
	describe("Scenario 1: Simple Inheritance", () => {
		/**
		 * Root/
		 *   Nested/        <- gesture: vertical
		 *     A leaf       <- gesture: none
		 *
		 * User is on A leaf:
		 * - vertical -> Nested (ancestor)
		 * - vertical-inverted -> none
		 * - horizontal -> none
		 */
		it("inherits vertical from ancestor", () => {
			const nested = createContext(claims("vertical"));
			const aLeaf = resolveOwnership(NO_CLAIMS, nested);

			expect(aLeaf.vertical).toBe("ancestor");
			expect(aLeaf["vertical-inverted"]).toBe("none");
			expect(aLeaf.horizontal).toBe("none");
			expect(aLeaf["horizontal-inverted"]).toBe("none");
		});
	});

	describe("Scenario 2: Two Axes, No Conflict", () => {
		/**
		 * Root/
		 *   Nested/        <- gesture: vertical
		 *     A leaf       <- gesture: none
		 *     B leaf       <- gesture: horizontal
		 *
		 * User is on B leaf:
		 * - vertical -> Nested (ancestor)
		 * - horizontal -> B leaf (self)
		 */
		it("B leaf owns horizontal, inherits vertical", () => {
			const nested = createContext(claims("vertical"));
			const bLeaf = resolveOwnership(claims("horizontal"), nested);

			expect(bLeaf.vertical).toBe("ancestor");
			expect(bLeaf.horizontal).toBe("self");
		});
	});

	describe("Scenario 3: Same Axis Shadowing", () => {
		/**
		 * Root/
		 *   Nested/        <- gesture: vertical
		 *     A leaf       <- gesture: none
		 *     B leaf       <- gesture: vertical
		 *
		 * User is on A leaf: vertical -> Nested (ancestor)
		 * User is on B leaf: vertical -> B leaf (self) - shadows Nested
		 */
		it("A leaf inherits vertical from Nested", () => {
			const nested = createContext(claims("vertical"));
			const aLeaf = resolveOwnership(NO_CLAIMS, nested);

			expect(aLeaf.vertical).toBe("ancestor");
		});

		it("B leaf shadows vertical (owns it)", () => {
			const nested = createContext(claims("vertical"));
			const bLeaf = resolveOwnership(claims("vertical"), nested);

			expect(bLeaf.vertical).toBe("self");
		});
	});

	describe("Scenario 4: Deep Nesting (3 Levels)", () => {
		/**
		 * Root/
		 *   Nested/            <- gesture: vertical
		 *     A leaf
		 *     Deeper/          <- gesture: horizontal
		 *       B leaf         <- gesture: none
		 *       C leaf         <- gesture: vertical
		 *
		 * User is on B leaf:
		 * - vertical -> Nested (2 levels up)
		 * - horizontal -> Deeper (1 level up)
		 *
		 * User is on C leaf:
		 * - vertical -> C leaf (self) - shadows Nested
		 * - horizontal -> Deeper (ancestor)
		 */
		it("B leaf inherits vertical from Nested, horizontal from Deeper", () => {
			const nested = createContext(claims("vertical"));
			const deeper = createContext(claims("horizontal"), nested);
			const bLeaf = resolveOwnership(NO_CLAIMS, deeper);

			expect(bLeaf.vertical).toBe("ancestor");
			expect(bLeaf.horizontal).toBe("ancestor");
		});

		it("C leaf shadows vertical, inherits horizontal", () => {
			const nested = createContext(claims("vertical"));
			const deeper = createContext(claims("horizontal"), nested);
			const cLeaf = resolveOwnership(claims("vertical"), deeper);

			expect(cLeaf.vertical).toBe("self");
			expect(cLeaf.horizontal).toBe("ancestor");
		});
	});

	describe("Scenario 5: Inverted Gesture", () => {
		/**
		 * Root/
		 *   Nested/        <- gesture: verticalInverted
		 *     A leaf       <- gesture: none
		 *
		 * User is on A leaf:
		 * - vertical -> none
		 * - vertical-inverted -> Nested (ancestor)
		 */
		it("inherits vertical-inverted from ancestor", () => {
			const nested = createContext(claims("vertical-inverted"));
			const aLeaf = resolveOwnership(NO_CLAIMS, nested);

			expect(aLeaf.vertical).toBe("none");
			expect(aLeaf["vertical-inverted"]).toBe("ancestor");
		});
	});

	describe("Scenario 6: Same Axis, Different Directions (Coexistence)", () => {
		/**
		 * Root/
		 *   Nested/        <- gesture: verticalInverted (up dismisses)
		 *     A leaf
		 *     B leaf       <- gesture: vertical (down dismisses)
		 *
		 * User is on B leaf:
		 * - vertical -> B leaf (self)
		 * - vertical-inverted -> Nested (ancestor)
		 */
		it("B leaf owns vertical, inherits vertical-inverted", () => {
			const nested = createContext(claims("vertical-inverted"));
			const bLeaf = resolveOwnership(claims("vertical"), nested);

			expect(bLeaf.vertical).toBe("self");
			expect(bLeaf["vertical-inverted"]).toBe("ancestor");
		});
	});

	describe("Scenario 7: Snap Points Shadow Same Axis", () => {
		/**
		 * Root/
		 *   Nested/        <- gesture: vertical
		 *     A leaf       <- snapPoints: [0.5, 0.8], gestureDirection: vertical
		 *
		 * A leaf with snap points claims both vertical AND vertical-inverted.
		 * This shadows Nested's vertical.
		 */
		it("snap point sheet shadows entire axis", () => {
			const nested = createContext(claims("vertical"));
			// Snap points claim both directions on the axis
			const aLeafClaims = computeClaimedDirections(true, "vertical", true);
			const aLeaf = resolveOwnership(aLeafClaims, nested);

			expect(aLeaf.vertical).toBe("self");
			expect(aLeaf["vertical-inverted"]).toBe("self");
			expect(aLeaf.horizontal).toBe("none");
		});
	});

	describe("Scenario 8: Snap Points + Different Axis Inheritance", () => {
		/**
		 * Root/
		 *   Nested/        <- gesture: vertical
		 *     A leaf       <- snapPoints: [0.5, 0.8], gestureDirection: horizontal (right drawer)
		 *
		 * A leaf claims horizontal axis (both directions).
		 * Vertical is free -> inherits from Nested.
		 */
		it("horizontal snap sheet inherits vertical from Nested", () => {
			const nested = createContext(claims("vertical"));
			// Horizontal snap points
			const aLeafClaims = computeClaimedDirections(true, "horizontal", true);
			const aLeaf = resolveOwnership(aLeafClaims, nested);

			expect(aLeaf.vertical).toBe("ancestor");
			expect(aLeaf["vertical-inverted"]).toBe("none");
			expect(aLeaf.horizontal).toBe("self");
			expect(aLeaf["horizontal-inverted"]).toBe("self");
		});
	});

	describe("Scenario 9: Deep Nesting with Snap Points", () => {
		/**
		 * Root/
		 *   Nested/            <- gesture: vertical
		 *     A leaf
		 *     Deeper/          <- gesture: horizontal
		 *       B leaf         <- snapPoints: [0.5, 0.8], gestureDirection: vertical
		 *
		 * B leaf (snap sheet) claims both vertical directions.
		 * - vertical -> B leaf (self) - shadows Nested
		 * - vertical-inverted -> B leaf (self)
		 * - horizontal -> Deeper (ancestor)
		 */
		it("snap sheet shadows vertical, inherits horizontal", () => {
			const nested = createContext(claims("vertical"));
			const deeper = createContext(claims("horizontal"), nested);
			// Vertical snap points
			const bLeafClaims = computeClaimedDirections(true, "vertical", true);
			const bLeaf = resolveOwnership(bLeafClaims, deeper);

			expect(bLeaf.vertical).toBe("self");
			expect(bLeaf["vertical-inverted"]).toBe("self");
			expect(bLeaf.horizontal).toBe("ancestor");
			expect(bLeaf["horizontal-inverted"]).toBe("none");
		});
	});

	describe("Edge Cases", () => {
		it("no ancestors, no claims -> all none", () => {
			const result = resolveOwnership(NO_CLAIMS, null);

			expect(result.vertical).toBe("none");
			expect(result["vertical-inverted"]).toBe("none");
			expect(result.horizontal).toBe("none");
			expect(result["horizontal-inverted"]).toBe("none");
		});

		it("no ancestors, with claims -> self", () => {
			const result = resolveOwnership(claims("vertical"), null);

			expect(result.vertical).toBe("self");
			expect(result["vertical-inverted"]).toBe("none");
		});

		it("deep chain - finds correct owner", () => {
			const level1 = createContext(claims("vertical"));
			const level2 = createContext(NO_CLAIMS, level1);
			const level3 = createContext(claims("horizontal"), level2);
			const level4 = createContext(NO_CLAIMS, level3);

			const result = resolveOwnership(NO_CLAIMS, level4);

			// vertical should be found at level1 (3 levels up)
			expect(result.vertical).toBe("ancestor");
			// horizontal should be found at level3 (1 level up)
			expect(result.horizontal).toBe("ancestor");
		});
	});
});
