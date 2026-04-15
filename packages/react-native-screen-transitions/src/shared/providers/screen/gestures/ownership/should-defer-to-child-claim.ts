import type { DirectionClaim } from "../types";

/**
 * Returns true when the current screen should fail and defer to a child claim.
 */
export function shouldDeferToChildClaim(
	childClaim: DirectionClaim,
	selfRouteKey: string,
): boolean {
	"worklet";
	if (!childClaim) return false;
	if (childClaim.routeKey === selfRouteKey) return false;
	if (childClaim.isDismissing.get()) return false;
	return true;
}
