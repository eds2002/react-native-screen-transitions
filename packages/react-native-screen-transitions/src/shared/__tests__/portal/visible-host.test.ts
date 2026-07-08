import { describe, expect, it } from "bun:test";
import { resolveNextVisiblePortalHostName } from "../../components/boundary/portal/utils/visible-host";

describe("resolveNextVisiblePortalHostName", () => {
	it("switches hosts immediately when the transition is known safe", () => {
		expect(
			resolveNextVisiblePortalHostName({
				canSwitchImmediately: true,
				isInterpolatorReady: false,
				requestedName: "screen-b-video-handoff-portal-host",
				shouldTeleport: true,
				visibleName: "screen-c-video-handoff-portal-host",
			}),
		).toBe("screen-b-video-handoff-portal-host");
	});

	it("holds screen hosts until the interpolator is ready", () => {
		expect(
			resolveNextVisiblePortalHostName({
				isInterpolatorReady: false,
				requestedName: "screen-b-video-portal-host",
				shouldTeleport: true,
				visibleName: "screen-c-video-portal-host",
			}),
		).toBe("screen-c-video-portal-host");
	});

	it("clears the host when teleport is disabled", () => {
		expect(
			resolveNextVisiblePortalHostName({
				isInterpolatorReady: true,
				requestedName: "screen-b-video-handoff-portal-host",
				shouldTeleport: false,
				visibleName: "screen-c-video-handoff-portal-host",
			}),
		).toBeNull();
	});

	it("holds handoff pushes until the destination is ready", () => {
		expect(
			resolveNextVisiblePortalHostName({
				canSwitchImmediately: false,
				isInterpolatorReady: false,
				requestedName: "screen-c-video-handoff-portal-host",
				shouldTeleport: true,
				visibleName: "screen-b-video-handoff-portal-host",
			}),
		).toBe("screen-b-video-handoff-portal-host");
	});
});
