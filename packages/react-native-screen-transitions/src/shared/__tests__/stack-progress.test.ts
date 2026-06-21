import { describe, expect, it } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import { deriveStackProgress } from "../providers/screen/animation/helpers/stack-progress";

const shared = (value: number) =>
	({
		get: () => value,
		set: () => {},
		value,
	}) as SharedValue<number>;

describe("deriveStackProgress", () => {
	it("sums visual progress from the current route to the top", () => {
		const routeKeys = ["a", "b", "c"];
		const visualProgressValues = [shared(1), shared(0.75), shared(0.5)];

		expect(
			deriveStackProgress(
				routeKeys,
				visualProgressValues,
				1,
				0,
				"b",
				0.75,
				"c",
				0.5,
			),
		).toBe(1.25);
	});

	it("uses freshly hydrated current and next progress before shared values", () => {
		const routeKeys = ["a", "b", "c"];
		const visualProgressValues = [shared(1), shared(1), shared(1)];

		expect(
			deriveStackProgress(
				routeKeys,
				visualProgressValues,
				1,
				0,
				"b",
				0.75,
				"c",
				0.5,
			),
		).toBe(1.25);
	});

	it("falls back to frame progress when the current route is absent", () => {
		expect(
			deriveStackProgress(["a"], [shared(1)], -1, 0.5, undefined, 0, undefined, 0),
		).toBe(0.5);
	});
});
