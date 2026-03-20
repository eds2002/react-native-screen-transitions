import { describe, expect, it } from "bun:test";
import {
	PASS_THROUGH_STYLE_OUTPUT,
	resolveInterpolatedStyleOutput,
} from "../providers/screen/helpers/resolve-interpolated-style-output";

describe("resolveInterpolatedStyleOutput", () => {
	it("treats null as an explicit deferred signal", () => {
		const resolved = resolveInterpolatedStyleOutput(null);

		expect(resolved.resolutionMode).toBe("deferred");
		expect(resolved.stylesMap).toEqual({});
		expect(resolved.wasLegacy).toBe(false);
	});

	it("treats undefined payloads as live empty styles", () => {
		const resolved = resolveInterpolatedStyleOutput(undefined);

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
});
