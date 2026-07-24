import { describe, expect, it } from "bun:test";
import { isTeleportEnabled } from "../../components/boundary/portal/utils/teleport-control";

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
});
