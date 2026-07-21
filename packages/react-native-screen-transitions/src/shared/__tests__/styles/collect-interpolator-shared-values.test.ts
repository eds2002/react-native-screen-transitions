import { describe, expect, it } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import type { ScreenStyleInterpolator } from "../../types/animation.types";
import { collectInterpolatorSharedValues } from "../../providers/screen/styles/helpers/collect-interpolator-shared-values";

type ClosureWorklet = (() => void) & {
	__closure?: Record<string, unknown>;
};

const createSharedValue = (label: string) =>
	({
		_isReanimatedSharedValue: true,
		get: () => label,
	}) as unknown as SharedValue<unknown>;

const createWorklet = (
	closure: Record<string, unknown>,
): ScreenStyleInterpolator =>
	Object.assign(() => ({}), {
		__closure: closure,
	}) as unknown as ScreenStyleInterpolator;

const createHelperWorklet = (closure: Record<string, unknown>): ClosureWorklet =>
	Object.assign(() => undefined, {
		__closure: closure,
	});

describe("collectInterpolatorSharedValues", () => {
	it("collects shared values from interpolator and nested helper closures", () => {
		const rootSharedValue = createSharedValue("root");
		const nestedSharedValue = createSharedValue("nested");
		const helper = createHelperWorklet({
			nested: {
				value: nestedSharedValue,
			},
		});
		const interpolator = createWorklet({
			rootSharedValue,
			helpers: [helper],
		});

		expect(collectInterpolatorSharedValues([interpolator])).toEqual([
			rootSharedValue,
			nestedSharedValue,
		]);
	});

	it("deduplicates shared values and ignores class instances", () => {
		class SharedValueHolder {
			constructor(public value: SharedValue<unknown>) {}
		}

		const sharedValue = createSharedValue("shared");
		const ignoredSharedValue = createSharedValue("ignored");
		const interpolator = createWorklet({
			first: sharedValue,
			second: sharedValue,
			holder: new SharedValueHolder(ignoredSharedValue),
		});

		expect(collectInterpolatorSharedValues([interpolator])).toEqual([
			sharedValue,
		]);
	});

	it("handles cyclic closure objects", () => {
		const sharedValue = createSharedValue("shared");
		const closure: Record<string, unknown> = {
			sharedValue,
		};
		closure.self = closure;

		expect(collectInterpolatorSharedValues([createWorklet(closure)])).toEqual([
			sharedValue,
		]);
	});
});
