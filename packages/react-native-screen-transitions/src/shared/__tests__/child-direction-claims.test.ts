import { describe, expect, it } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import type {
	DirectionClaim,
	DirectionClaimMap,
} from "../providers/gestures.provider";

/**
 * Mock SharedValue for testing - mimics Reanimated's SharedValue interface
 */
function mockSharedValue<T>(initial: T): SharedValue<T> {
	return {
		value: initial,
		addListener: () => -1,
		removeListener: () => {},
		modify: () => {},
	} as unknown as SharedValue<T>;
}

/**
 * Simulates the child claim check logic from use-screen-gesture-handlers.ts
 *
 * Returns true if the gesture should FAIL (defer to child)
 * Returns false if the gesture should CONTINUE (no blocking claim)
 */
function shouldDeferToChildClaim(
	childClaim: DirectionClaim,
	selfRouteKey: string,
): boolean {
	if (!childClaim) return false;
	if (childClaim.routeKey === selfRouteKey) return false;
	if (childClaim.isDismissing.value) return false; // Ignore dismissing children
	return true;
}

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
				isDismissing: mockSharedValue(0),
			};
			const result = shouldDeferToChildClaim(claim, selfRouteKey);
			expect(result).toBe(false);
		});

		it("returns true when child has active claim (not dismissing)", () => {
			const claim: DirectionClaim = {
				routeKey: childRouteKey,
				isDismissing: mockSharedValue(0), // 0 = not dismissing
			};
			const result = shouldDeferToChildClaim(claim, selfRouteKey);
			expect(result).toBe(true);
		});

		it("returns false when child is dismissing (isDismissing = 1)", () => {
			const claim: DirectionClaim = {
				routeKey: childRouteKey,
				isDismissing: mockSharedValue(1), // 1 = dismissing
			};
			const result = shouldDeferToChildClaim(claim, selfRouteKey);
			expect(result).toBe(false);
		});

		it("allows parent to activate when child starts dismissing", () => {
			// Simulate: child claimed direction, then started dismissing
			const isDismissing = mockSharedValue(0);
			const claim: DirectionClaim = {
				routeKey: childRouteKey,
				isDismissing,
			};

			// Initially, parent should defer
			expect(shouldDeferToChildClaim(claim, selfRouteKey)).toBe(true);

			// Child starts dismissing
			isDismissing.value = 1;

			// Now parent should NOT defer (can activate)
			expect(shouldDeferToChildClaim(claim, selfRouteKey)).toBe(false);
		});
	});

	describe("DirectionClaimMap usage", () => {
		const selfRouteKey = "parent-route-123";
		const childRouteKey = "child-route-456";

		it("allows checking claims per direction independently", () => {
			const claims: DirectionClaimMap = {
				vertical: {
					routeKey: childRouteKey,
					isDismissing: mockSharedValue(0),
				},
				"vertical-inverted": {
					routeKey: childRouteKey,
					isDismissing: mockSharedValue(0),
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
			const isDismissing = mockSharedValue(0);
			const claims: DirectionClaimMap = {
				vertical: { routeKey: childRouteKey, isDismissing },
				"vertical-inverted": { routeKey: childRouteKey, isDismissing },
				horizontal: null,
				"horizontal-inverted": null,
			};

			// Parent should defer for both vertical directions
			expect(shouldDeferToChildClaim(claims.vertical, selfRouteKey)).toBe(true);
			expect(
				shouldDeferToChildClaim(claims["vertical-inverted"], selfRouteKey),
			).toBe(true);

			// When child starts dismissing, parent can take over BOTH directions
			isDismissing.value = 1;
			expect(shouldDeferToChildClaim(claims.vertical, selfRouteKey)).toBe(
				false,
			);
			expect(
				shouldDeferToChildClaim(claims["vertical-inverted"], selfRouteKey),
			).toBe(false);
		});

		it("handles multiple children claiming different directions", () => {
			const child1RouteKey = "child-1";
			const child2RouteKey = "child-2";

			const claims: DirectionClaimMap = {
				vertical: {
					routeKey: child1RouteKey,
					isDismissing: mockSharedValue(0),
				},
				"vertical-inverted": null,
				horizontal: {
					routeKey: child2RouteKey,
					isDismissing: mockSharedValue(1), // This one is dismissing
				},
				"horizontal-inverted": null,
			};

			// Should defer for vertical (child1 claimed, not dismissing)
			expect(shouldDeferToChildClaim(claims.vertical, selfRouteKey)).toBe(true);

			// Should NOT defer for horizontal (child2 is dismissing)
			expect(shouldDeferToChildClaim(claims.horizontal, selfRouteKey)).toBe(
				false,
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
		 * 2. User swipes down on Child to dismiss
		 * 3. While Child is animating out, user swipes down on Parent
		 * 4. Parent should be able to activate (Child's claim is ignored)
		 */
		it("parent can activate while shadowing child is dismissing", () => {
			const parentRouteKey = "parent";
			const childRouteKey = "child";

			// Child registers claim on parent when mounted
			const childIsDismissing = mockSharedValue(0);
			const parentChildClaims: DirectionClaimMap = {
				vertical: { routeKey: childRouteKey, isDismissing: childIsDismissing },
				"vertical-inverted": null,
				horizontal: null,
				"horizontal-inverted": null,
			};

			// Step 1: Child is active, parent should defer
			expect(
				shouldDeferToChildClaim(parentChildClaims.vertical, parentRouteKey),
			).toBe(true);

			// Step 2: User dismisses child
			childIsDismissing.value = 1;

			// Step 3: Parent should now be able to activate
			expect(
				shouldDeferToChildClaim(parentChildClaims.vertical, parentRouteKey),
			).toBe(false);
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
				isDismissing: mockSharedValue(0),
			};
			expect(shouldDeferToChildClaim(claims.vertical, parentRouteKey)).toBe(
				true,
			);

			// Child 1 unmounts, child 2 mounts and claims
			claims.vertical = {
				routeKey: child2RouteKey,
				isDismissing: mockSharedValue(0),
			};
			expect(shouldDeferToChildClaim(claims.vertical, parentRouteKey)).toBe(
				true,
			);

			// Child 2 starts dismissing
			claims.vertical!.isDismissing.value = 1;
			expect(shouldDeferToChildClaim(claims.vertical, parentRouteKey)).toBe(
				false,
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
