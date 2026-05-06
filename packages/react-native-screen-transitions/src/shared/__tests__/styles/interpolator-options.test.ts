import { describe, expect, it } from "bun:test";
import type { TransitionInterpolatedStyle } from "../../types/animation.types";
import {
	syncScreenOptionsOverrides,
	type ScreenOptionsContextValue,
} from "../../providers/screen/options";
import { stripInterpolatorOptions } from "../../providers/screen/styles/helpers/strip-interpolator-options";

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
	gestureEnabled: true,
	experimental_allowDisabledGestureTracking: false,
	gestureDirection: "horizontal",
	gestureSensitivity: 1,
	gestureVelocityImpact: 0.3,
	gestureSnapVelocityImpact: 0.1,
	gestureReleaseVelocityScale: 1,
	gestureResponseDistance: undefined,
	gestureDrivesProgress: true,
	gestureActivationArea: "screen",
	gestureSnapLocked: false,
	sheetScrollGestureBehavior: "expand-and-collapse",
	backdropBehavior: "block",
} as const;

const createScreenOptionsContext = (): ScreenOptionsContextValue =>
	({
		gestureEnabled: createSharedValue(BASE_SCREEN_OPTIONS.gestureEnabled),
		experimental_allowDisabledGestureTracking: createSharedValue(
			BASE_SCREEN_OPTIONS.experimental_allowDisabledGestureTracking,
		),
		gestureDirection: createSharedValue(BASE_SCREEN_OPTIONS.gestureDirection),
		gestureSensitivity: createSharedValue(
			BASE_SCREEN_OPTIONS.gestureSensitivity,
		),
		gestureVelocityImpact: createSharedValue(
			BASE_SCREEN_OPTIONS.gestureVelocityImpact,
		),
		gestureSnapVelocityImpact: createSharedValue(
			BASE_SCREEN_OPTIONS.gestureSnapVelocityImpact,
		),
		gestureReleaseVelocityScale: createSharedValue(
			BASE_SCREEN_OPTIONS.gestureReleaseVelocityScale,
		),
		gestureResponseDistance: createSharedValue(
			BASE_SCREEN_OPTIONS.gestureResponseDistance,
		),
		gestureDrivesProgress: createSharedValue(
			BASE_SCREEN_OPTIONS.gestureDrivesProgress,
		),
		gestureActivationArea: createSharedValue(
			BASE_SCREEN_OPTIONS.gestureActivationArea,
		),
		gestureSnapLocked: createSharedValue(
			BASE_SCREEN_OPTIONS.gestureSnapLocked,
		),
		sheetScrollGestureBehavior: createSharedValue(
			BASE_SCREEN_OPTIONS.sheetScrollGestureBehavior,
		),
		backdropBehavior: createSharedValue(BASE_SCREEN_OPTIONS.backdropBehavior),
		baseOptions: createSharedValue(BASE_SCREEN_OPTIONS),
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
				experimental_allowDisabledGestureTracking: true,
				gestureDirection: ["horizontal", "pinch-out"],
				gestureSensitivity: 0.25,
				gestureVelocityImpact: 0.4,
				gestureSnapVelocityImpact: 0.2,
				gestureReleaseVelocityScale: 1.5,
				gestureResponseDistance: 24,
				gestureDrivesProgress: false,
				gestureActivationArea: {
					left: "edge",
					right: "screen",
				},
				gestureSnapLocked: true,
				sheetScrollGestureBehavior: "collapse-only",
				backdropBehavior: "dismiss",
			},
		};

		syncScreenOptionsOverrides(raw, screenOptions);

		expect(screenOptions.gestureEnabled.get()).toBe(false);
		expect(
			screenOptions.experimental_allowDisabledGestureTracking.get(),
		).toBe(true);
		expect(screenOptions.gestureDirection.get()).toEqual([
			"horizontal",
			"pinch-out",
		]);
		expect(screenOptions.gestureSensitivity.get()).toBe(0.25);
		expect(screenOptions.gestureVelocityImpact.get()).toBe(0.4);
		expect(screenOptions.gestureSnapVelocityImpact.get()).toBe(0.2);
		expect(screenOptions.gestureReleaseVelocityScale.get()).toBe(1.5);
		expect(screenOptions.gestureResponseDistance.get()).toBe(24);
		expect(screenOptions.gestureDrivesProgress.get()).toBe(false);
		expect(screenOptions.gestureActivationArea.get()).toEqual({
			left: "edge",
			right: "screen",
		});
		expect(screenOptions.gestureSnapLocked.get()).toBe(true);
		expect(screenOptions.sheetScrollGestureBehavior.get()).toBe(
			"collapse-only",
		);
		expect(screenOptions.backdropBehavior.get()).toBe("dismiss");
	});

	it("resets screen options to their base values when options are missing", () => {
		const screenOptions = createScreenOptionsContext();

		syncScreenOptionsOverrides(
			{
				options: {
					gestureSensitivity: 0.25,
					gestureSnapLocked: true,
					backdropBehavior: "dismiss",
				},
			},
			screenOptions,
		);
		syncScreenOptionsOverrides({}, screenOptions);

		expect(screenOptions.gestureSensitivity.get()).toBe(
			BASE_SCREEN_OPTIONS.gestureSensitivity,
		);
		expect(screenOptions.gestureSnapLocked.get()).toBe(
			BASE_SCREEN_OPTIONS.gestureSnapLocked,
		);
		expect(screenOptions.backdropBehavior.get()).toBe(
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
					gestureActivationArea: "edge",
					sheetScrollGestureBehavior: "collapse-only",
					backdropBehavior: "dismiss",
				},
			},
			screenOptions,
		);
		syncScreenOptionsOverrides(
			{
				options: {
					gestureDirection: "diagonal",
					gestureSensitivity: "fast",
					gestureActivationArea: { left: "corner" },
					sheetScrollGestureBehavior: "expand-only",
					backdropBehavior: "fade",
				},
			} as any,
			screenOptions,
		);

		expect(screenOptions.gestureDirection.get()).toBe(
			BASE_SCREEN_OPTIONS.gestureDirection,
		);
		expect(screenOptions.gestureSensitivity.get()).toBe(
			BASE_SCREEN_OPTIONS.gestureSensitivity,
		);
		expect(screenOptions.gestureActivationArea.get()).toBe(
			BASE_SCREEN_OPTIONS.gestureActivationArea,
		);
		expect(screenOptions.sheetScrollGestureBehavior.get()).toBe(
			BASE_SCREEN_OPTIONS.sheetScrollGestureBehavior,
		);
		expect(screenOptions.backdropBehavior.get()).toBe(
			BASE_SCREEN_OPTIONS.backdropBehavior,
		);
	});
});
