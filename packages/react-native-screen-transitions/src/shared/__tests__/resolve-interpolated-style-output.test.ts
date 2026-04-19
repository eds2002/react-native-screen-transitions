import { describe, expect, it } from "bun:test";
import {
	resolveInterpolatedStyleOutput,
} from "../providers/screen/styles/helpers/resolve-interpolated-style-output";

describe("resolveInterpolatedStyleOutput", () => {
	it("treats null as empty styles", () => {
		const resolved = resolveInterpolatedStyleOutput(null);

		expect(resolved.stylesMap).toEqual({});
		expect(resolved.wasLegacy).toBe(false);
	});

	it("treats undefined payloads as empty styles", () => {
		const resolved = resolveInterpolatedStyleOutput(undefined);

		expect(resolved.stylesMap).toEqual({});
		expect(resolved.wasLegacy).toBe(false);
	});

	it("treats empty object payloads as empty styles", () => {
		const resolved = resolveInterpolatedStyleOutput({});

		expect(resolved.stylesMap).toEqual({});
		expect(resolved.wasLegacy).toBe(false);
	});

	it("normalizes legacy payloads into styles", () => {
		const resolved = resolveInterpolatedStyleOutput({
			contentStyle: { opacity: 0.5 },
		});

		expect(resolved.wasLegacy).toBe(true);
		expect(resolved.stylesMap.content?.style).toEqual({ opacity: 0.5 });
	});
});
