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
	gestureProgressMode: "progress-driven",
	gestureDrivesProgress: true,
	gestureActivationArea: "screen",
	gestureSnapLocked: false,
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
				experimental_allowDisabledGestureTracking: true,
				gestureDirection: ["horizontal", "pinch-out"],
				gestureSensitivity: 0.25,
				gestureVelocityImpact: 0.4,
				gestureSnapVelocityImpact: 0.2,
				gestureReleaseVelocityScale: 1.5,
				gestureResponseDistance: 24,
				gestureProgressMode: "freeform",
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
		const next = screenOptions.get();

		expect(next.gestureEnabled).toBe(false);
		expect(next.experimental_allowDisabledGestureTracking).toBe(true);
		expect(next.gestureDirection).toEqual([
			"horizontal",
			"pinch-out",
		]);
		expect(next.gestureSensitivity).toBe(0.25);
		expect(next.gestureVelocityImpact).toBe(0.4);
		expect(next.gestureSnapVelocityImpact).toBe(0.2);
		expect(next.gestureReleaseVelocityScale).toBe(1.5);
		expect(next.gestureResponseDistance).toBe(24);
		expect(next.gestureProgressMode).toBe("freeform");
		expect(next.gestureDrivesProgress).toBe(false);
		expect(next.gestureActivationArea).toEqual({
			left: "edge",
			right: "screen",
		});
		expect(next.gestureSnapLocked).toBe(true);
		expect(next.sheetScrollGestureBehavior).toBe("collapse-only");
		expect(next.backdropBehavior).toBe("dismiss");
	});

	it("maps the deprecated gestureDrivesProgress override onto gestureProgressMode", () => {
		const screenOptions = createScreenOptionsContext();

		syncScreenOptionsOverrides(
			{
				options: {
					gestureDrivesProgress: false,
				},
			},
			screenOptions,
		);
		const next = screenOptions.get();

		expect(next.gestureProgressMode).toBe("freeform");
		expect(next.gestureDrivesProgress).toBe(false);
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
		const next = screenOptions.get();

		expect(next.gestureSensitivity).toBe(
			BASE_SCREEN_OPTIONS.gestureSensitivity,
		);
		expect(next.gestureSnapLocked).toBe(
			BASE_SCREEN_OPTIONS.gestureSnapLocked,
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
		const next = screenOptions.get();

		expect(next.gestureDirection).toBe(
			BASE_SCREEN_OPTIONS.gestureDirection,
		);
		expect(next.gestureSensitivity).toBe(
			BASE_SCREEN_OPTIONS.gestureSensitivity,
		);
		expect(next.gestureActivationArea).toBe(
			BASE_SCREEN_OPTIONS.gestureActivationArea,
		);
		expect(next.sheetScrollGestureBehavior).toBe(
			BASE_SCREEN_OPTIONS.sheetScrollGestureBehavior,
		);
		expect(next.backdropBehavior).toBe(
			BASE_SCREEN_OPTIONS.backdropBehavior,
		);
	});
});
