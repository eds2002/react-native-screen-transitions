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
import {
	applyGestureSensitivityToPanEvent,
	trackPanGesture,
} from "../providers/screen/gestures/helpers/pan-phases";
import {
	applyGestureSensitivityToPinchEvent,
	trackPinchGesture,
} from "../providers/screen/gestures/helpers/pinch-phases";

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
		runtimeOverrides: {
			gestureSensitivity: { get: () => runtimeSensitivity },
		},
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
});

describe("getPinchReleaseHandoffVelocity", () => {
	it("treats pinch velocity as scale velocity and applies release velocity scale", () => {
		expect(getPinchReleaseHandoffVelocity(1.2)).toBeCloseTo(1.2, 5);
		expect(getPinchReleaseHandoffVelocity(8)).toBeCloseTo(8, 5);
		expect(getPinchReleaseHandoffVelocity(8, 0.5)).toBeCloseTo(4, 5);
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

describe("applyGestureSensitivityToPanEvent", () => {
	it("scales pan translation and velocity before release consumers read them", () => {
		const event = createEvent({
			translationX: 200,
			translationY: -80,
			velocityX: 1000,
			velocityY: -500,
		});

		const sensitiveEvent = applyGestureSensitivityToPanEvent(
			event,
			createGestureRuntime(0.1),
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

		const sensitiveEvent = applyGestureSensitivityToPanEvent(
			event,
			createGestureRuntime(0.1),
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

		const sensitiveEvent = applyGestureSensitivityToPanEvent(
			event,
			createGestureRuntime(1, 0.25),
		);

		expect(sensitiveEvent.translationX).toBeCloseTo(50, 5);
		expect(sensitiveEvent.velocityX).toBeCloseTo(250, 5);
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

describe("applyGestureSensitivityToPinchEvent", () => {
	it("scales pinch scale delta and velocity before release consumers read them", () => {
		const event = {
			scale: 2,
			velocity: 4,
		} as any;

		const sensitiveEvent = applyGestureSensitivityToPinchEvent(
			event,
			createGestureRuntime(0.25),
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

		const sensitiveEvent = applyGestureSensitivityToPinchEvent(
			event,
			createGestureRuntime(0.5),
		);

		expect(
			shouldDismissFromPinch(
				normalizePinchScale(sensitiveEvent.scale),
				true,
				false,
			),
			).toBe(false);
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
