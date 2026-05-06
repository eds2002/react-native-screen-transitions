import { describe, expect, it } from "bun:test";
import {
	applyGestureSensitivity,
	getPanReleaseHandoffVelocity,
	getPanReleaseProgressVelocity,
	getPinchReleaseHandoffVelocity,
	normalizePinchScale,
	shouldDismissFromPinch,
	shouldDismissFromProjection,
	toProgressVelocity,
} from "../providers/screen/gestures/helpers/gesture-physics";
import { determineDismissal } from "../providers/screen/gestures/helpers/gesture-targets";
import { trackPanGesture } from "../providers/screen/gestures/helpers/pan-phases";
import { trackPinchGesture } from "../providers/screen/gestures/helpers/pinch-phases";
import { applyGestureSensitivityToRawChange } from "../providers/screen/gestures/hooks/use-gesture-sensitivity";
import { PanStrategy } from "../providers/screen/gestures/behaviors/strategies/pan.strategy";
import { PinchStrategy } from "../providers/screen/gestures/behaviors/strategies/pinch.strategy";
import type { ScreenOptionsContextValue } from "../providers/screen/options";

type Directions = {
	horizontal: boolean;
	horizontalInverted: boolean;
	vertical: boolean;
	verticalInverted: boolean;
};

type GestureEventInit = {
	translationX?: number;
	translationY?: number;
	velocityX?: number;
	velocityY?: number;
};

const createAnimations = (progress: number) =>
	({
		progress: { get: () => progress },
		closing: { get: () => 0 },
		animating: { get: () => 0 },
	}) as const;

const createEvent = ({
	translationX = 0,
	translationY = 0,
	velocityX = 0,
	velocityY = 0,
}: GestureEventInit) =>
	({ translationX, translationY, velocityX, velocityY }) as any;

const createDirections = (overrides: Partial<Directions> = {}) => ({
	horizontal: false,
	horizontalInverted: false,
	vertical: false,
	verticalInverted: false,
	...overrides,
});

const createGestureRuntime = (
	gestureSensitivity: number,
	runtimeSensitivity: number | null = null,
) =>
	({
		policy: { gestureSensitivity },
		screenOptions: createScreenOptions(runtimeSensitivity ?? gestureSensitivity),
		stores: {
			gestures: createGestureStore(),
		},
	}) as any;

const createPanStrategyRuntime = (canDismiss: boolean, progress: number = 0.3) =>
	({
		participation: { canDismiss },
		policy: {
			panActivationDirections: createDirections({ horizontal: true }),
			gestureVelocityImpact: 0,
			gestureReleaseVelocityScale: 1,
			transitionSpec: undefined,
		},
		stores: { animations: createAnimations(progress) },
	}) as any;

const createPinchStrategyRuntime = (
	canDismiss: boolean,
	progress: number = 0.3,
) =>
	({
		participation: { canDismiss },
		policy: {
			pinchInEnabled: true,
			pinchOutEnabled: false,
			gestureReleaseVelocityScale: 1,
			transitionSpec: undefined,
		},
		gestureProgressBaseline: { get: () => 1 },
		stores: { animations: createAnimations(progress) },
	}) as any;

const createSharedValue = <T>(initialValue: T) => {
	let value = initialValue;

	return {
		get: () => value,
		set: (nextValue: T) => {
			value = nextValue;
		},
	};
};

const createScreenOption = () => createSharedValue<unknown>(null);

const createScreenOptions = (
	gestureSensitivity: number | null,
): ScreenOptionsContextValue =>
	({
		gestureEnabled: createScreenOption(),
		experimental_allowDisabledGestureTracking: createScreenOption(),
		gestureDirection: createScreenOption(),
		gestureSensitivity: createSharedValue(gestureSensitivity ?? 1),
		gestureVelocityImpact: createScreenOption(),
		gestureSnapVelocityImpact: createScreenOption(),
		gestureReleaseVelocityScale: createScreenOption(),
		gestureResponseDistance: createScreenOption(),
		gestureDrivesProgress: createScreenOption(),
		gestureActivationArea: createScreenOption(),
		gestureSnapLocked: createScreenOption(),
		sheetScrollGestureBehavior: createScreenOption(),
		backdropBehavior: createScreenOption(),
		baseOptions: createScreenOption(),
	}) as ScreenOptionsContextValue;

const createGestureStore = () =>
	({
		x: createSharedValue(0),
		y: createSharedValue(0),
		normX: createSharedValue(0),
		normY: createSharedValue(0),
		scale: createSharedValue(1),
		normScale: createSharedValue(0),
		focalX: createSharedValue(0),
		focalY: createSharedValue(0),
		raw: {
			x: createSharedValue(0),
			y: createSharedValue(0),
			normX: createSharedValue(0),
			normY: createSharedValue(0),
			scale: createSharedValue(1),
			normScale: createSharedValue(0),
		},
		dismissing: createSharedValue(0),
		dragging: createSharedValue(0),
		direction: createSharedValue(null),
	}) as any;

const createSensitivityRawChangeState = () => ({
	previousRawValue: createSharedValue(0),
	adjustedValue: createSharedValue(0),
});

const createPanSensitivityStates = () => ({
	x: createSensitivityRawChangeState(),
	y: createSensitivityRawChangeState(),
});

const createPinchSensitivityStates = () => ({
	normScale: createSensitivityRawChangeState(),
});

const applyAndTrackPanEvent = (
	runtime: any,
	sensitivityStates: any,
	rawEvent: any,
) => {
	const sensitivity = runtime.screenOptions.gestureSensitivity.get();
	const event = {
		...rawEvent,
		translationX: applyGestureSensitivityToRawChange(
			rawEvent.translationX,
			sensitivity,
			sensitivityStates.x,
		),
		translationY: applyGestureSensitivityToRawChange(
			rawEvent.translationY,
			sensitivity,
			sensitivityStates.y,
		),
		velocityX: applyGestureSensitivity(rawEvent.velocityX, sensitivity),
		velocityY: applyGestureSensitivity(rawEvent.velocityY, sensitivity),
	};

	trackPanGesture(event, rawEvent, runtime.stores.gestures, {
		width: 400,
		height: 800,
	});

	return event;
};

const applyAndTrackPinchEvent = (
	runtime: any,
	sensitivityStates: any,
	rawEvent: any,
) => {
	const sensitivity = runtime.screenOptions.gestureSensitivity.get();
	const normScale = applyGestureSensitivityToRawChange(
		normalizePinchScale(rawEvent.scale),
		sensitivity,
		sensitivityStates.normScale,
	);
	const event = {
		...rawEvent,
		scale: 1 + normScale,
		velocity: applyGestureSensitivity(rawEvent.velocity, sensitivity),
	};

	trackPinchGesture(event, rawEvent, runtime.stores.gestures);

	return event;
};

describe("toProgressVelocity", () => {
	it("converts pixels per second into progress units per second", () => {
		expect(toProgressVelocity(6400, 320)).toBeCloseTo(20, 5);
		expect(toProgressVelocity(-6400, 320)).toBeCloseTo(-20, 5);
	});
});

describe("getPanReleaseHandoffVelocity", () => {
	it("normalizes pan release velocity into progress units per second", () => {
		expect(getPanReleaseHandoffVelocity(6400, 320)).toBeCloseTo(20, 5);
		expect(getPanReleaseHandoffVelocity(-6400, 320)).toBeCloseTo(-20, 5);
	});

	it("applies release velocity scale without capping", () => {
		expect(getPanReleaseHandoffVelocity(800, 320, 0.5)).toBeCloseTo(1.25, 5);
		expect(getPanReleaseHandoffVelocity(800, 320, 2)).toBeCloseTo(5, 5);
	});

	it("caps release velocity when gestureReleaseVelocityMax is provided", () => {
		expect(getPanReleaseHandoffVelocity(6400, 320, 1, 3.2)).toBeCloseTo(
			3.2,
			5,
		);
		expect(getPanReleaseHandoffVelocity(-6400, 320, 1, 3.2)).toBeCloseTo(
			-3.2,
			5,
		);
	});
});

describe("getPinchReleaseHandoffVelocity", () => {
	it("treats pinch velocity as scale velocity and applies release velocity scale", () => {
		expect(getPinchReleaseHandoffVelocity(1.2)).toBeCloseTo(1.2, 5);
		expect(getPinchReleaseHandoffVelocity(8)).toBeCloseTo(8, 5);
		expect(getPinchReleaseHandoffVelocity(8, 0.5)).toBeCloseTo(4, 5);
	});

	it("caps pinch release velocity when gestureReleaseVelocityMax is provided", () => {
		expect(getPinchReleaseHandoffVelocity(8, 1, 3.2)).toBeCloseTo(3.2, 5);
		expect(getPinchReleaseHandoffVelocity(-8, 1, 3.2)).toBeCloseTo(-3.2, 5);
	});
});

describe("normalizePinchScale", () => {
	it("returns the raw pinch delta before sensitivity or progress clamping", () => {
		expect(normalizePinchScale(0.5)).toBeCloseTo(-0.5, 5);
		expect(normalizePinchScale(1)).toBeCloseTo(0, 5);
		expect(normalizePinchScale(2)).toBeCloseTo(1, 5);
		expect(normalizePinchScale(3)).toBeCloseTo(2, 5);
	});

	it("allows sensitivity to reduce travel without hard-capping pinch-out early", () => {
		expect(applyGestureSensitivity(normalizePinchScale(3), 0.75)).toBeCloseTo(
			1.5,
			5,
		);
	});
});

describe("getPanReleaseProgressVelocity", () => {
	const dimensions = { width: 320, height: 640 };

	it("returns positive magnitude when progressing toward open target", () => {
		const animations = createAnimations(0.25);
		const event = createEvent({
			translationX: 48,
			translationY: 6,
			velocityX: 800,
		});

		const result = getPanReleaseProgressVelocity({
			animations: animations as any,
			shouldDismiss: false,
			event,
			dimensions,
			directions: createDirections({ horizontal: true }),
			gestureReleaseVelocityScale: 1,
		});

		expect(result).toBeCloseTo(2.5, 5);
	});

	it("prefers the axis with greater normalized translation", () => {
		const animations = createAnimations(0.8);
		const event = createEvent({
			translationX: 24,
			translationY: -140,
			velocityX: 120,
			velocityY: -900,
		});

		const result = getPanReleaseProgressVelocity({
			animations: animations as any,
			shouldDismiss: true,
			event,
			dimensions,
			directions: createDirections({
				horizontal: true,
				verticalInverted: true,
			}),
			gestureReleaseVelocityScale: 1,
		});

		expect(result).toBeLessThan(0);
		expect(Math.abs(result)).toBeCloseTo(1.406, 3);
	});

	it("returns uncapped normalized velocity for the selected axis", () => {
		const animations = createAnimations(0.5);
		const event = createEvent({
			translationX: 10,
			velocityX: 5000,
		});

		const result = getPanReleaseProgressVelocity({
			animations: animations as any,
			shouldDismiss: false,
			event,
			dimensions,
			directions: createDirections({ horizontal: true }),
			gestureReleaseVelocityScale: 1,
		});

		expect(result).toBeCloseTo(15.625, 5);
	});

	it("ignores axis movement that could not have driven gesture progress", () => {
		const animations = createAnimations(0.8);
		const event = createEvent({
			translationX: -220, // opposite of horizontal dismiss direction
			translationY: 96, // valid vertical dismiss direction
			velocityX: -2200,
			velocityY: 640,
		});

		const result = getPanReleaseProgressVelocity({
			animations: animations as any,
			shouldDismiss: true,
			event,
			dimensions,
			directions: createDirections({
				horizontal: true,
				vertical: true,
			}),
			gestureReleaseVelocityScale: 1,
		});

		// Uses vertical candidate (96/640), not unsupported horizontal movement.
		expect(result).toBeCloseTo(-1, 5);
	});
});

describe("PanStrategy.resolveRelease", () => {
	const dimensions = { width: 320, height: 640 };

	it("prevents dismissal when the screen cannot dismiss", () => {
		const event = createEvent({ translationX: 200, velocityX: 0 });
		const release = PanStrategy.resolveRelease(
			event,
			createPanStrategyRuntime(false),
			dimensions,
		);

		expect(release.shouldDismiss).toBe(false);
		expect(release.target).toBe(1);
	});

	it("allows dismissal when the screen can dismiss", () => {
		const event = createEvent({ translationX: 200, velocityX: 0 });
		const release = PanStrategy.resolveRelease(
			event,
			createPanStrategyRuntime(true),
			dimensions,
		);

		expect(release.shouldDismiss).toBe(true);
		expect(release.target).toBe(0);
	});
});

describe("pan gesture sensitivity", () => {
	it("scales pan translation and velocity before release consumers read them", () => {
		const runtime = createGestureRuntime(0.1);
		const sensitivityStates = createPanSensitivityStates();

		const sensitiveEvent = applyAndTrackPanEvent(
			runtime,
			sensitivityStates,
			createEvent({
				translationX: 200,
				translationY: -80,
				velocityX: 1000,
				velocityY: -500,
			}),
		);

		expect(sensitiveEvent.translationX).toBeCloseTo(20, 5);
		expect(sensitiveEvent.translationY).toBeCloseTo(-8, 5);
		expect(sensitiveEvent.velocityX).toBeCloseTo(100, 5);
		expect(sensitiveEvent.velocityY).toBeCloseTo(-50, 5);
	});

	it("makes dismissal projection respect gesture sensitivity", () => {
		const dimensions = { width: 320, height: 640 };
		const event = createEvent({
			translationX: 170,
			velocityX: 0,
		});

		expect(
			determineDismissal({
				event,
				directions: createDirections({ horizontal: true }),
				dimensions,
				gestureVelocityImpact: 0,
			}).shouldDismiss,
		).toBe(true);

		const sensitiveEvent = applyAndTrackPanEvent(
			createGestureRuntime(0.1),
			createPanSensitivityStates(),
			event,
		);

		expect(
			determineDismissal({
				event: sensitiveEvent,
				directions: createDirections({ horizontal: true }),
				dimensions,
				gestureVelocityImpact: 0,
			}).shouldDismiss,
		).toBe(false);
	});

	it("prefers runtime config sensitivity over the route option", () => {
		const event = createEvent({
			translationX: 200,
			velocityX: 1000,
		});

		const sensitiveEvent = applyAndTrackPanEvent(
			createGestureRuntime(1, 0.25),
			createPanSensitivityStates(),
			event,
		);

		expect(sensitiveEvent.translationX).toBeCloseTo(50, 5);
		expect(sensitiveEvent.velocityX).toBeCloseTo(250, 5);
	});

	it("applies lower runtime sensitivity only to future pan deltas", () => {
		const runtime = createGestureRuntime(1, 1);
		const sensitivityStates = createPanSensitivityStates();

		const firstEvent = applyAndTrackPanEvent(
			runtime,
			sensitivityStates,
			createEvent({ translationX: 100, velocityX: 500 }),
		);
		runtime.screenOptions.gestureSensitivity.set(0.1);
		const secondEvent = applyAndTrackPanEvent(
			runtime,
			sensitivityStates,
			createEvent({ translationX: 120, velocityX: 500 }),
		);

		expect(firstEvent.translationX).toBeCloseTo(100, 5);
		expect(secondEvent.translationX).toBeCloseTo(102, 5);
		expect(secondEvent.velocityX).toBeCloseTo(50, 5);
	});

	it("applies higher runtime sensitivity only to future pan deltas", () => {
		const runtime = createGestureRuntime(1, 0.1);
		const sensitivityStates = createPanSensitivityStates();

		const firstEvent = applyAndTrackPanEvent(
			runtime,
			sensitivityStates,
			createEvent({ translationX: 100 }),
		);
		runtime.screenOptions.gestureSensitivity.set(1);
		const secondEvent = applyAndTrackPanEvent(
			runtime,
			sensitivityStates,
			createEvent({ translationX: 200 }),
		);

		expect(firstEvent.translationX).toBeCloseTo(10, 5);
		expect(secondEvent.translationX).toBeCloseTo(110, 5);
	});

	it("freezes new pan movement while runtime sensitivity is zero", () => {
		const runtime = createGestureRuntime(1, 1);
		const sensitivityStates = createPanSensitivityStates();

		applyAndTrackPanEvent(
			runtime,
			sensitivityStates,
			createEvent({ translationX: 100 }),
		);
		runtime.screenOptions.gestureSensitivity.set(0);
		const frozenEvent = applyAndTrackPanEvent(
			runtime,
			sensitivityStates,
			createEvent({ translationX: 200, velocityX: 500 }),
		);

		expect(frozenEvent.translationX).toBeCloseTo(100, 5);
		expect(frozenEvent.velocityX).toBeCloseTo(0, 5);
	});

	it("applies current runtime sensitivity to reverse pan deltas", () => {
		const runtime = createGestureRuntime(1, 1);
		const sensitivityStates = createPanSensitivityStates();

		applyAndTrackPanEvent(
			runtime,
			sensitivityStates,
			createEvent({ translationX: 100 }),
		);
		runtime.screenOptions.gestureSensitivity.set(0.1);
		const reverseEvent = applyAndTrackPanEvent(
			runtime,
			sensitivityStates,
			createEvent({ translationX: 80, velocityX: -300 }),
		);

		expect(reverseEvent.translationX).toBeCloseTo(98, 5);
		expect(reverseEvent.velocityX).toBeCloseTo(-30, 5);
	});
});

describe("trackPanGesture", () => {
	it("stores sensitivity-adjusted and raw pan values separately", () => {
		const gestures = createGestureStore();
		const event = createEvent({
			translationX: 50,
			translationY: -20,
		});
		const rawEvent = createEvent({
			translationX: 200,
			translationY: -80,
		});

		trackPanGesture(event, rawEvent, gestures, { width: 400, height: 200 });

		expect(gestures.x.get()).toBeCloseTo(50, 5);
		expect(gestures.y.get()).toBeCloseTo(-20, 5);
		expect(gestures.normX.get()).toBeCloseTo(0.125, 5);
		expect(gestures.normY.get()).toBeCloseTo(-0.1, 5);
		expect(gestures.raw.x.get()).toBeCloseTo(200, 5);
		expect(gestures.raw.y.get()).toBeCloseTo(-80, 5);
		expect(gestures.raw.normX.get()).toBeCloseTo(0.5, 5);
		expect(gestures.raw.normY.get()).toBeCloseTo(-0.4, 5);
	});
});

describe("pinch gesture sensitivity", () => {
	it("scales pinch scale delta and velocity before release consumers read them", () => {
		const runtime = createGestureRuntime(0.25);
		const sensitivityStates = createPinchSensitivityStates();

		const sensitiveEvent = applyAndTrackPinchEvent(
			runtime,
			sensitivityStates,
			{
				scale: 2,
				velocity: 4,
			} as any,
		);

		expect(sensitiveEvent.scale).toBeCloseTo(1.25, 5);
		expect(sensitiveEvent.velocity).toBeCloseTo(1, 5);
	});

	it("makes pinch dismissal threshold respect gesture sensitivity", () => {
		const event = {
			scale: 0.4,
			velocity: -4,
		} as any;

		expect(
			shouldDismissFromPinch(normalizePinchScale(event.scale), true, false),
		).toBe(true);

		const sensitiveEvent = applyAndTrackPinchEvent(
			createGestureRuntime(0.5),
			createPinchSensitivityStates(),
			event,
		);

		expect(
			shouldDismissFromPinch(
				normalizePinchScale(sensitiveEvent.scale),
				true,
				false,
			),
			).toBe(false);
	});

	it("applies lower runtime sensitivity only to future pinch scale deltas", () => {
		const runtime = createGestureRuntime(1, 1);
		const sensitivityStates = createPinchSensitivityStates();

		const firstEvent = applyAndTrackPinchEvent(runtime, sensitivityStates, {
			scale: 2,
			velocity: 4,
		});
		runtime.screenOptions.gestureSensitivity.set(0.1);
		const secondEvent = applyAndTrackPinchEvent(runtime, sensitivityStates, {
			scale: 2.2,
			velocity: 4,
		});

		expect(firstEvent.scale).toBeCloseTo(2, 5);
		expect(secondEvent.scale).toBeCloseTo(2.02, 5);
		expect(secondEvent.velocity).toBeCloseTo(0.4, 5);
	});

	it("applies higher runtime sensitivity only to future pinch scale deltas", () => {
		const runtime = createGestureRuntime(1, 0.1);
		const sensitivityStates = createPinchSensitivityStates();

		const firstEvent = applyAndTrackPinchEvent(runtime, sensitivityStates, {
			scale: 2,
		});
		runtime.screenOptions.gestureSensitivity.set(1);
		const secondEvent = applyAndTrackPinchEvent(runtime, sensitivityStates, {
			scale: 2.2,
		});

		expect(firstEvent.scale).toBeCloseTo(1.1, 5);
		expect(secondEvent.scale).toBeCloseTo(1.3, 5);
	});

	it("freezes new pinch movement while runtime sensitivity is zero", () => {
		const runtime = createGestureRuntime(1, 1);
		const sensitivityStates = createPinchSensitivityStates();

		applyAndTrackPinchEvent(runtime, sensitivityStates, {
			scale: 2,
		});
		runtime.screenOptions.gestureSensitivity.set(0);
		const frozenEvent = applyAndTrackPinchEvent(runtime, sensitivityStates, {
			scale: 2.5,
			velocity: 4,
		});

		expect(frozenEvent.scale).toBeCloseTo(2, 5);
		expect(frozenEvent.velocity).toBeCloseTo(0, 5);
	});
});

describe("trackPinchGesture", () => {
	it("stores sensitivity-adjusted and raw pinch values separately", () => {
		const gestures = createGestureStore();
		const event = {
			scale: 1.25,
			focalX: 12,
			focalY: 24,
		} as any;
		const rawEvent = {
			scale: 2,
			focalX: 12,
			focalY: 24,
		} as any;

		trackPinchGesture(event, rawEvent, gestures);

		expect(gestures.scale.get()).toBeCloseTo(1.25, 5);
		expect(gestures.normScale.get()).toBeCloseTo(0.25, 5);
		expect(gestures.raw.scale.get()).toBeCloseTo(2, 5);
		expect(gestures.raw.normScale.get()).toBeCloseTo(1, 5);
	});
});

describe("PinchStrategy.resolveRelease", () => {
	it("prevents dismissal when the screen cannot dismiss", () => {
		const release = PinchStrategy.resolveRelease(
			{ scale: 0.4, velocity: -2 } as any,
			createPinchStrategyRuntime(false),
		);

		expect(release.shouldDismiss).toBe(false);
		expect(release.target).toBe(1);
	});

	it("allows dismissal when the screen can dismiss", () => {
		const release = PinchStrategy.resolveRelease(
			{ scale: 0.4, velocity: -2 } as any,
			createPinchStrategyRuntime(true),
		);

		expect(release.shouldDismiss).toBe(true);
		expect(release.target).toBe(0);
	});
});

describe("shouldDismissFromProjection", () => {
	const width = 320;

	it("returns true once translation alone crosses half the screen", () => {
		expect(shouldDismissFromProjection(170, 0, width, 0.3)).toBe(
			true,
		);
	});

	it("combines translation with weighted velocity", () => {
		expect(shouldDismissFromProjection(40, 2500, width, 0.5)).toBe(true);
	});

	it("returns false when movement is negligible", () => {
		expect(shouldDismissFromProjection(0, 0, width, 0.3)).toBe(false);
	});
});
