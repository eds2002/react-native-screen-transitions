import { describe, expect, it } from "bun:test";
import type { TransitionInterpolatedStyle } from "../../types/animation.types";
import {
	syncScreenOptionsOverrides,
	type ScreenOptionsContextValue,
} from "../../providers/screen/motion/options";
import { stripInterpolatorOptions } from "../../providers/screen/orchestrator/styles/helpers/strip-interpolator-options";

const createSharedValue = <T>(initialValue: T) => {
	let value = initialValue;

	return {
		get: () => value,
		set: (nextValue: T) => {
			value = nextValue;
		},
	};
};

const BASE_SCREEN_OPTIONS = {
	navigationMaskEnabled: undefined,
	gestureEnabled: true,
	gestureTracking: "auto",
	gestureDirection: "horizontal",
	gestureSensitivity: 1,
	gestureVelocityImpact: 0.3,
	gestureSnapVelocityImpact: 0.1,
	gestureReleaseVelocityScale: 1,
	gestureSnapLocked: false,
	sheetSnapBehavior: "continuous",
	sheetScrollGestureBehavior: "expand-and-collapse",
	backdropBehavior: "block",
} as const;

const createScreenOptionsContext = (): ScreenOptionsContextValue =>
	createSharedValue({
		...BASE_SCREEN_OPTIONS,
		baseOptions: BASE_SCREEN_OPTIONS,
	}) as ScreenOptionsContextValue;

describe("stripInterpolatorOptions", () => {
	it("removes reserved options before style slot normalization", () => {
		const raw = {
			options: {
				gestureSensitivity: 0.5,
				gestureSnapLocked: true,
				gestureReleaseVelocityScale: 1.2,
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

describe("syncScreenOptionsOverrides", () => {
	it("sets flat interpolator options", () => {
		const screenOptions = createScreenOptionsContext();
		const raw: TransitionInterpolatedStyle = {
			options: {
				gestureEnabled: false,
				gestureDirection: [
					{ gesture: "horizontal", area: 28 },
					{ gesture: "pinch-out", area: "edge" },
				],
				gestureSensitivity: 0.25,
				gestureVelocityImpact: 0.4,
				gestureSnapVelocityImpact: 0.2,
				gestureReleaseVelocityScale: 1.5,
				gestureSnapLocked: true,
				sheetSnapBehavior: "step",
				sheetScrollGestureBehavior: "collapse-only",
				backdropBehavior: "dismiss",
			},
		};

		syncScreenOptionsOverrides(raw, screenOptions);
		const next = screenOptions.get();

		expect(next.navigationMaskEnabled).toBe(
			BASE_SCREEN_OPTIONS.navigationMaskEnabled,
		);
		expect(next.gestureEnabled).toBe(false);
		expect(next.gestureDirection).toEqual([
			{ gesture: "horizontal", area: 28 },
			{ gesture: "pinch-out", area: "edge" },
		]);
		expect(next.gestureSensitivity).toBe(0.25);
		expect(next.gestureVelocityImpact).toBe(0.4);
		expect(next.gestureSnapVelocityImpact).toBe(0.2);
		expect(next.gestureReleaseVelocityScale).toBe(1.5);
		expect(next.gestureSnapLocked).toBe(true);
		expect(next.sheetSnapBehavior).toBe("step");
		expect(next.sheetScrollGestureBehavior).toBe("collapse-only");
		expect(next.backdropBehavior).toBe("dismiss");
	});

	it("ignores structural runtime option overrides", () => {
		const screenOptions = createScreenOptionsContext();

		syncScreenOptionsOverrides(
			{
				options: {
					navigationMaskEnabled: true,
					gestureTracking: "always",
				},
			} as unknown as TransitionInterpolatedStyle,
			screenOptions,
		);
		const next = screenOptions.get();

		expect(next.navigationMaskEnabled).toBe(
			BASE_SCREEN_OPTIONS.navigationMaskEnabled,
		);
		expect(next.gestureTracking).toBe(BASE_SCREEN_OPTIONS.gestureTracking);
	});

	it("resets screen options to their base values when options are missing", () => {
		const screenOptions = createScreenOptionsContext();

		syncScreenOptionsOverrides(
			{
				options: {
					gestureSensitivity: 0.25,
					gestureSnapLocked: true,
					sheetSnapBehavior: "step",
					backdropBehavior: "dismiss",
				},
			},
			screenOptions,
		);
		syncScreenOptionsOverrides({}, screenOptions);
		const next = screenOptions.get();

		expect(next.navigationMaskEnabled).toBe(
			BASE_SCREEN_OPTIONS.navigationMaskEnabled,
		);
		expect(next.gestureSensitivity).toBe(
			BASE_SCREEN_OPTIONS.gestureSensitivity,
		);
		expect(next.gestureSnapLocked).toBe(
			BASE_SCREEN_OPTIONS.gestureSnapLocked,
		);
		expect(next.sheetSnapBehavior).toBe(
			BASE_SCREEN_OPTIONS.sheetSnapBehavior,
		);
		expect(next.backdropBehavior).toBe(
			BASE_SCREEN_OPTIONS.backdropBehavior,
		);
	});

	it("resets invalid screen options to their base values", () => {
		const screenOptions = createScreenOptionsContext();

		syncScreenOptionsOverrides(
			{
				options: {
					gestureDirection: "vertical",
					gestureSensitivity: 0.25,
					sheetScrollGestureBehavior: "collapse-only",
					sheetSnapBehavior: "step",
					backdropBehavior: "dismiss",
				},
			},
			screenOptions,
		);
		syncScreenOptionsOverrides(
			{
				options: {
					gestureSensitivity: "fast",
					gestureDirection: [{ gesture: "vertical", area: -1 }],
					sheetScrollGestureBehavior: "expand-only",
					sheetSnapBehavior: "paged",
					backdropBehavior: "fade",
				},
			} as unknown as TransitionInterpolatedStyle,
			screenOptions,
		);
		const next = screenOptions.get();

		expect(next.navigationMaskEnabled).toBe(
			BASE_SCREEN_OPTIONS.navigationMaskEnabled,
		);
		expect(next.gestureDirection).toBe(
			BASE_SCREEN_OPTIONS.gestureDirection,
		);
		expect(next.gestureSensitivity).toBe(
			BASE_SCREEN_OPTIONS.gestureSensitivity,
		);
		expect(next.sheetScrollGestureBehavior).toBe(
			BASE_SCREEN_OPTIONS.sheetScrollGestureBehavior,
		);
		expect(next.sheetSnapBehavior).toBe(
			BASE_SCREEN_OPTIONS.sheetSnapBehavior,
		);
		expect(next.backdropBehavior).toBe(
			BASE_SCREEN_OPTIONS.backdropBehavior,
		);
	});
});
