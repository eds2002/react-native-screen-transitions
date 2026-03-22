import { describe, expect, it } from "bun:test";
import {
	PASS_THROUGH_STYLE_OUTPUT,
	resolveEffectiveResolutionMode,
	resolveInterpolatedStyleOutput,
} from "../providers/screen/helpers/resolve-interpolated-style-output";

describe("resolveInterpolatedStyleOutput", () => {
	it("treats null as pass-through empty styles", () => {
		const resolved = resolveInterpolatedStyleOutput(null);

		expect(resolved.resolutionMode).toBe("pass-through");
		expect(resolved.stylesMap).toEqual({});
		expect(resolved.wasLegacy).toBe(false);
	});

	it("treats undefined payloads as pass-through empty styles", () => {
		const resolved = resolveInterpolatedStyleOutput(undefined);

		expect(resolved.resolutionMode).toBe("pass-through");
		expect(resolved.stylesMap).toEqual({});
		expect(resolved.wasLegacy).toBe(false);
	});

	it("treats an explicit defer signal as deferred", () => {
		const resolved = resolveInterpolatedStyleOutput("defer");

		expect(resolved.resolutionMode).toBe("deferred");
		expect(resolved.stylesMap).toEqual({});
		expect(resolved.wasLegacy).toBe(false);
	});

	it("treats empty object payloads as live empty styles", () => {
		const resolved = resolveInterpolatedStyleOutput({});

		expect(resolved.resolutionMode).toBe("live");
		expect(resolved.stylesMap).toEqual({});
		expect(resolved.wasLegacy).toBe(false);
	});

	it("normalizes legacy payloads into live styles", () => {
		const resolved = resolveInterpolatedStyleOutput({
			contentStyle: { opacity: 0.5 },
		});

		expect(resolved.resolutionMode).toBe("live");
		expect(resolved.wasLegacy).toBe(true);
		expect(resolved.stylesMap.content?.style).toEqual({ opacity: 0.5 });
	});

	it("exposes a pass-through sentinel for missing interpolators", () => {
		expect(PASS_THROUGH_STYLE_OUTPUT.resolutionMode).toBe("pass-through");
		expect(PASS_THROUGH_STYLE_OUTPUT.stylesMap).toEqual({});
		expect(PASS_THROUGH_STYLE_OUTPUT.wasLegacy).toBe(false);
	});

	it("degrades deferred resolution to pass-through once the screen settles", () => {
		expect(
			resolveEffectiveResolutionMode({
				resolutionMode: "deferred",
				isSettled: false,
			}),
		).toBe("deferred");

		expect(
			resolveEffectiveResolutionMode({
				resolutionMode: "deferred",
				isSettled: true,
			}),
		).toBe("pass-through");

		expect(
			resolveEffectiveResolutionMode({
				resolutionMode: "live",
				isSettled: true,
			}),
		).toBe("live");
	});
});
