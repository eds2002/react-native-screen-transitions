import { beforeEach, describe, expect, it } from "bun:test";
import {
	getActiveHostKey,
	getHostCapturesScroll,
	registerHost,
	resetHostRegistry,
	unregisterHost,
} from "../../components/boundary/portal/stores/host-registry.store";

beforeEach(() => {
	resetHostRegistry();
});

describe("portal host registry", () => {
	it("keeps fallback pinned under a user host regardless of mount order", () => {
		registerHost({
			capturesScroll: true,
			fallback: false,
			hostKey: "screen-a-user-host",
			screenKey: "screen-a",
		});
		registerHost({
			capturesScroll: false,
			fallback: true,
			hostKey: "screen-a",
			screenKey: "screen-a",
		});

		expect(getActiveHostKey("screen-a")).toBe("screen-a-user-host");
	});

	it("resumes the fallback host when the user host unmounts", () => {
		registerHost({
			capturesScroll: false,
			fallback: true,
			hostKey: "screen-a",
			screenKey: "screen-a",
		});
		registerHost({
			capturesScroll: true,
			fallback: false,
			hostKey: "screen-a-user-host",
			screenKey: "screen-a",
		});

		unregisterHost("screen-a", "screen-a-user-host");

		expect(getActiveHostKey("screen-a")).toBe("screen-a");
	});

	it("falls back to the raw screen key when no host has registered", () => {
		expect(getActiveHostKey("screen-a")).toBe("screen-a");
	});

	it("uses the latest non-fallback host", () => {
		registerHost({
			capturesScroll: false,
			fallback: true,
			hostKey: "screen-a",
			screenKey: "screen-a",
		});
		registerHost({
			capturesScroll: true,
			fallback: false,
			hostKey: "screen-a-user-host-1",
			screenKey: "screen-a",
		});
		registerHost({
			capturesScroll: true,
			fallback: false,
			hostKey: "screen-a-user-host-2",
			screenKey: "screen-a",
		});

		expect(getActiveHostKey("screen-a")).toBe("screen-a-user-host-2");
	});

	it("tracks whether a host captures scroll", () => {
		registerHost({
			capturesScroll: false,
			fallback: true,
			hostKey: "screen-a",
			screenKey: "screen-a",
		});
		registerHost({
			capturesScroll: true,
			fallback: false,
			hostKey: "screen-a-scroll-host",
			screenKey: "screen-a",
		});

		expect(getHostCapturesScroll("screen-a")).toBe(false);
		expect(getHostCapturesScroll("screen-a-scroll-host")).toBe(true);
		expect(getHostCapturesScroll("missing-host")).toBe(false);
	});

	it("resolves each screen's active host independently of the other side", () => {
		registerHost({
			capturesScroll: false,
			fallback: true,
			hostKey: "screen-a",
			screenKey: "screen-a",
		});
		registerHost({
			capturesScroll: true,
			fallback: false,
			hostKey: "screen-a-scroll-host",
			screenKey: "screen-a",
		});
		registerHost({
			capturesScroll: false,
			fallback: true,
			hostKey: "screen-b",
			screenKey: "screen-b",
		});

		// A paired transition resolves the source (a) and destination (b) hosts
		// separately: a scroll-hosted source must not leak into the destination's
		// resolution and vice versa.
		expect(getActiveHostKey("screen-a")).toBe("screen-a-scroll-host");
		expect(getHostCapturesScroll(getActiveHostKey("screen-a"))).toBe(true);
		expect(getActiveHostKey("screen-b")).toBe("screen-b");
		expect(getHostCapturesScroll(getActiveHostKey("screen-b"))).toBe(false);
	});
});
