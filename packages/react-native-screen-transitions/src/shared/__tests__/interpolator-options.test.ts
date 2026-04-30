import { describe, expect, it } from "bun:test";
import type { TransitionInterpolatedStyle } from "../types/animation.types";
import { stripInterpolatorOptions } from "../providers/screen/styles/helpers/strip-interpolator-options";
import { syncGestureRuntimeOverrides } from "../providers/screen/styles/helpers/sync-gesture-runtime-overrides";

const createSharedValue = <T>(initialValue: T) => {
	let value = initialValue;

	return {
		get: () => value,
		set: (nextValue: T) => {
			value = nextValue;
		},
	};
};

const createGestureContext = () => ({
	runtimeOverrides: {
		gestureSensitivity: createSharedValue<number | null>(null),
	},
});

describe("stripInterpolatorOptions", () => {
	it("removes reserved options before style slot normalization", () => {
		const raw = {
			options: {
				gestures: {
					gestureSensitivity: 0.5,
				},
			},
			content: {
				style: {
					opacity: 0.8,
				},
			},
			artwork: {
				style: {
					scale: 0.9,
				},
			},
		};

		expect(stripInterpolatorOptions(raw)).toEqual({
			content: {
				style: {
					opacity: 0.8,
				},
			},
			artwork: {
				style: {
					scale: 0.9,
				},
			},
		});
	});

	it("returns the original object when no options are present", () => {
		const raw = {
			content: {
				style: {
					opacity: 1,
				},
			},
		};

		expect(stripInterpolatorOptions(raw)).toBe(raw);
	});
});

describe("syncGestureRuntimeOverrides", () => {
	it("sets gesture sensitivity from interpolator gesture options", () => {
		const gestureContext = createGestureContext();
		const raw: TransitionInterpolatedStyle = {
			options: {
				gestures: {
					gestureSensitivity: 0.25,
				},
			},
		};

		syncGestureRuntimeOverrides(raw, gestureContext as any);

		expect(gestureContext.runtimeOverrides.gestureSensitivity.get()).toBe(0.25);
	});

	it("clears gesture sensitivity when options are missing", () => {
		const gestureContext = createGestureContext();

		syncGestureRuntimeOverrides(
			{
				options: {
					gestures: {
						gestureSensitivity: 0.25,
					},
				},
			},
			gestureContext as any,
		);
		syncGestureRuntimeOverrides({}, gestureContext as any);

		expect(gestureContext.runtimeOverrides.gestureSensitivity.get()).toBeNull();
	});

	it("clears gesture sensitivity when it is invalid", () => {
		const gestureContext = createGestureContext();

		syncGestureRuntimeOverrides(
			{
				options: {
					gestures: {
						gestureSensitivity: 0.25,
					},
				},
			},
			gestureContext as any,
		);
		syncGestureRuntimeOverrides(
			{
				options: {
					gestures: {
						gestureSensitivity: "fast",
					},
				},
			} as any,
			gestureContext as any,
		);

		expect(gestureContext.runtimeOverrides.gestureSensitivity.get()).toBeNull();
	});
});
