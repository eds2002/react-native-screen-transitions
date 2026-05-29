import { describe, expect, it } from "bun:test";
import type {
	DirectionClaim,
	DirectionClaimMap,
} from "../../../providers/screen/gestures";
import { shouldDeferToChildClaim } from "../../../providers/screen/gestures/ownership/resolve-ownership";

describe("Child Direction Claims", () => {
	describe("shouldDeferToChildClaim", () => {
		const selfRouteKey = "parent-route-123";
		const childRouteKey = "child-route-456";

		it("returns false when no claim exists", () => {
			const result = shouldDeferToChildClaim(null, selfRouteKey);
			expect(result).toBe(false);
		});

		it("returns false when claim is from self (same routeKey)", () => {
			const claim: DirectionClaim = {
				routeKey: selfRouteKey,
			};
			const result = shouldDeferToChildClaim(claim, selfRouteKey);
			expect(result).toBe(false);
		});

		it("returns true when child has a claim", () => {
			const claim: DirectionClaim = {
				routeKey: childRouteKey,
			};
			const result = shouldDeferToChildClaim(claim, selfRouteKey);
			expect(result).toBe(true);
		});
	});

	describe("DirectionClaimMap usage", () => {
		const selfRouteKey = "parent-route-123";
		const childRouteKey = "child-route-456";

		it("allows checking claims per direction independently", () => {
			const claims: DirectionClaimMap = {
				vertical: {
					routeKey: childRouteKey,
				},
				"vertical-inverted": {
					routeKey: childRouteKey,
				},
				horizontal: null, // No claim on horizontal
				"horizontal-inverted": null,
			};

			// Should defer for vertical (child claimed it)
			expect(shouldDeferToChildClaim(claims.vertical, selfRouteKey)).toBe(true);

			// Should defer for vertical-inverted (child claimed it)
			expect(
				shouldDeferToChildClaim(claims["vertical-inverted"], selfRouteKey),
			).toBe(true);

			// Should NOT defer for horizontal (no claim)
			expect(shouldDeferToChildClaim(claims.horizontal, selfRouteKey)).toBe(
				false,
			);
		});

		it("handles snap sheet claiming both directions on axis", () => {
			// Snap sheet claims both vertical and vertical-inverted
			const claims: DirectionClaimMap = {
				vertical: { routeKey: childRouteKey },
				"vertical-inverted": { routeKey: childRouteKey },
				horizontal: null,
				"horizontal-inverted": null,
			};

			// Parent should defer for both vertical directions
			expect(shouldDeferToChildClaim(claims.vertical, selfRouteKey)).toBe(true);
			expect(
				shouldDeferToChildClaim(claims["vertical-inverted"], selfRouteKey),
			).toBe(true);
		});

		it("handles multiple children claiming different directions", () => {
			const child1RouteKey = "child-1";
			const child2RouteKey = "child-2";

			const claims: DirectionClaimMap = {
				vertical: {
					routeKey: child1RouteKey,
				},
				"vertical-inverted": null,
				horizontal: {
					routeKey: child2RouteKey,
				},
				"horizontal-inverted": null,
			};

			// Should defer for vertical (child1 claimed, not dismissing)
			expect(shouldDeferToChildClaim(claims.vertical, selfRouteKey)).toBe(true);

			// Should defer for horizontal until child2 clears its claim
			expect(shouldDeferToChildClaim(claims.horizontal, selfRouteKey)).toBe(
				true,
			);
		});
	});

	describe("Scenario: Shadowing with dismiss", () => {
		/**
		 * Scenario from the spec:
		 *
		 * Root/
		 *   Parent/        <- gesture: vertical
		 *     Child        <- gesture: vertical (shadows parent)
		 *
		 * 1. User opens Child (Child claims vertical on Parent)
		 * 2. User swipes down on Child to dismiss; Child keeps its claim
		 * 3. While Child is animating out, user swipes down on Parent
		 * 4. Parent should keep deferring until Child clears its claim on unmount
		 */
		it("parent stays blocked while shadowing child is dismissing", () => {
			const parentRouteKey = "parent";
			const childRouteKey = "child";

			// Child registers claim on parent when mounted
			const parentChildClaims: DirectionClaimMap = {
				vertical: { routeKey: childRouteKey },
				"vertical-inverted": null,
				horizontal: null,
				"horizontal-inverted": null,
			};

			// Step 1: Child is active, parent should defer
			expect(
				shouldDeferToChildClaim(parentChildClaims.vertical, parentRouteKey),
			).toBe(true);

			// Steps 2-3: Dismissal does not change ownership; cleanup does.
			expect(
				shouldDeferToChildClaim(parentChildClaims.vertical, parentRouteKey),
			).toBe(true);
		});
	});

	describe("Edge cases", () => {
		it("handles rapid child mount/unmount", () => {
			const parentRouteKey = "parent";
			const child1RouteKey = "child-1";
			const child2RouteKey = "child-2";

			const claims: DirectionClaimMap = {
				vertical: null,
				"vertical-inverted": null,
				horizontal: null,
				"horizontal-inverted": null,
			};

			// Child 1 mounts and claims
			claims.vertical = {
				routeKey: child1RouteKey,
			};
			expect(shouldDeferToChildClaim(claims.vertical, parentRouteKey)).toBe(
				true,
			);

			// Child 1 unmounts, child 2 mounts and claims
			claims.vertical = {
				routeKey: child2RouteKey,
			};
			expect(shouldDeferToChildClaim(claims.vertical, parentRouteKey)).toBe(
				true,
			);
		});

		it("claim cleared on unmount does not affect parent", () => {
			const parentRouteKey = "parent";

			const claims: DirectionClaimMap = {
				vertical: null, // Claim was cleared when child unmounted
				"vertical-inverted": null,
				horizontal: null,
				"horizontal-inverted": null,
			};

			// No claim = parent can activate
			expect(shouldDeferToChildClaim(claims.vertical, parentRouteKey)).toBe(
				false,
			);
		});
	});
});
