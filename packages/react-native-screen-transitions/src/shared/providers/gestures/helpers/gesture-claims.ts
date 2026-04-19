import type { DirectionClaim } from "../types";

/**
 * Determines if the parent gesture should defer to a child's claim on a direction.
 *
 * Returns true if gesture should FAIL (defer to child).
 * Returns false if gesture should CONTINUE.
 *
 * Rules:
 * - No claim exists → don't defer (parent handles it)
 * - Claim is from self → don't defer (it's our own claim)
 * - Child is dismissing → don't defer (parent can take over)
 * - Otherwise → defer to child
 */
export function shouldDeferToChildClaim(
	childClaim: DirectionClaim,
	selfRouteKey: string,
): boolean {
	"worklet";
	if (!childClaim) return false;
	if (childClaim.routeKey === selfRouteKey) return false;
	if (childClaim.isDismissing.value) return false;
	return true;
}
