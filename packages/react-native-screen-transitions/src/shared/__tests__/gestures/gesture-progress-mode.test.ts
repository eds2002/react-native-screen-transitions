import { describe, expect, it } from "bun:test";
import {
	gestureProgressModeDrivesProgress,
	resolveGestureProgressMode,
	resolveGestureProgressModeFromOptions,
} from "../../utils/gesture-progress-mode";

describe("gesture progress mode", () => {
	it("defaults to progress-driven mode", () => {
		expect(resolveGestureProgressMode(undefined)).toBe("progress-driven");
	});

	it("maps the deprecated boolean option to a mode", () => {
		expect(resolveGestureProgressMode(true)).toBe("progress-driven");
		expect(resolveGestureProgressMode(false)).toBe("freeform");
	});

	it("prefers explicit mode over the deprecated boolean", () => {
		expect(
			resolveGestureProgressMode({
				gestureProgressMode: "freeform",
				gestureDrivesProgress: true,
			}),
		).toBe("freeform");
	});

	it("prefers primary options before fallback options", () => {
		expect(
			resolveGestureProgressModeFromOptions(
				{ gestureDrivesProgress: false },
				{ gestureProgressMode: "progress-driven" },
			),
		).toBe("freeform");
	});

	it("derives the legacy progress-driven boolean from mode", () => {
		expect(gestureProgressModeDrivesProgress("progress-driven")).toBe(true);
		expect(gestureProgressModeDrivesProgress("freeform")).toBe(false);
	});
});
