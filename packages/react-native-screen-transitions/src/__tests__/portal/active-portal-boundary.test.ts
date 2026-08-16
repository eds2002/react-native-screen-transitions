import { describe, expect, it } from "bun:test";
import { resolveActivePortalPairKey } from "../../components/boundary/portal/components/boundary-portal/hooks/use-active-portal-boundary-host";

describe("active portal boundary", () => {
	const pairKey = "route-a::route-b";

	it("keeps an unselected matched boundary inside the animated screen", () => {
		expect(
			resolveActivePortalPairKey({
				pairKey,
				measurementPairKey: pairKey,
				hasAnimatedSlot: false,
			}),
		).toBeNull();
	});

	it("escapes the selected boundary when its animation slot is emitted", () => {
		expect(
			resolveActivePortalPairKey({
				pairKey,
				measurementPairKey: pairKey,
				hasAnimatedSlot: true,
			}),
		).toBe(pairKey);
	});

	it("rejects a stale measurement from an older route pair", () => {
		expect(
			resolveActivePortalPairKey({
				pairKey,
				measurementPairKey: "route-older::route-a",
				hasAnimatedSlot: true,
			}),
		).toBeNull();
	});
});
