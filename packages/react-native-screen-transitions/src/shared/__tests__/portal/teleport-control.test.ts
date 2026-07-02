import { describe, expect, it } from "bun:test";
import {
	isTeleportEnabled,
	shouldAttachBoundaryPortal,
} from "../../components/boundary/portal/utils/teleport-control";

describe("portal teleport control", () => {
	it("defaults to enabled when the slot prop is omitted", () => {
		expect(isTeleportEnabled(undefined)).toBe(true);
	});

	it("supports boolean control", () => {
		expect(isTeleportEnabled(true)).toBe(true);
		expect(isTeleportEnabled(false)).toBe(false);
	});

	it("supports object control", () => {
		expect(isTeleportEnabled({})).toBe(true);
		expect(isTeleportEnabled({ enabled: true })).toBe(true);
		expect(isTeleportEnabled({ enabled: false })).toBe(false);
	});

	it("attaches only portal-enabled boundaries", () => {
		expect(
			shouldAttachBoundaryPortal({
				enabled: true,
			}),
		).toBe(true);
		expect(shouldAttachBoundaryPortal({ enabled: false })).toBe(false);
	});

	it("lets slot props detach a portal-enabled boundary", () => {
		expect(
			shouldAttachBoundaryPortal({
				enabled: true,
				teleport: false,
			}),
		).toBe(false);
		expect(
			shouldAttachBoundaryPortal({
				enabled: true,
				teleport: { enabled: false },
			}),
		).toBe(false);
	});
});
