import { describe, expect, it } from "bun:test";
import { resolveReadyPortalHostName } from "../../components/boundary/portal/components/boundary-portal/helpers/host-readiness";

describe("portal boundary host readiness", () => {
	it("does not let a stale host clear the newly ready host", () => {
		const previousHost = "portal:pair-a";
		const nextHost = "portal:pair-b";

		const nextReady = resolveReadyPortalHostName({
			currentReadyHostName: previousHost,
			hostName: nextHost,
			ready: true,
		});

		expect(
			resolveReadyPortalHostName({
				currentReadyHostName: nextReady,
				hostName: previousHost,
				ready: false,
			}),
		).toBe(nextHost);
	});

	it("clears readiness when the active host becomes invalid", () => {
		expect(
			resolveReadyPortalHostName({
				currentReadyHostName: "portal:pair-a",
				hostName: "portal:pair-a",
				ready: false,
			}),
		).toBeNull();
	});
});
