import { describe, expect, it } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import {
	resolveStackProgress,
	syncStackProgressValues,
} from "../providers/screen/animation/helpers/stack-progress";

const shared = (initial: number) => {
	let current = initial;

	return {
		get: () => current,
		set: (value: number) => {
			current = value;
		},
		get value() {
			return current;
		},
		set value(value: number) {
			current = value;
		},
	} as SharedValue<number>;
};

describe("stack progress", () => {
	it("syncs accumulated progress from each route to the top", () => {
		const visualProgressValues = [shared(1), shared(0.75), shared(0.5)];
		const stackProgressValues = [shared(0), shared(0), shared(0)];

		syncStackProgressValues(visualProgressValues, stackProgressValues);

		expect(stackProgressValues[0]?.get()).toBe(2.25);
		expect(stackProgressValues[1]?.get()).toBe(1.25);
		expect(stackProgressValues[2]?.get()).toBe(0.5);
	});

	it("resolves freshly hydrated current and next progress over the root value", () => {
		expect(resolveStackProgress(shared(2), 0, 0.75, 1, 0.5, 1)).toBe(1.25);
	});

	it("falls back to frame progress when no stack value is available", () => {
		expect(resolveStackProgress(undefined, 0.5, 0, undefined, undefined, undefined)).toBe(0.5);
	});
});
