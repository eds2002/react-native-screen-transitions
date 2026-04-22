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
import { resolveSensitivePanGestureEvent } from "../providers/screen/gestures/helpers/pan-phases";
import { resolveSensitivePinchGestureEvent } from "../providers/screen/gestures/helpers/pinch-phases";

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

describe("toProgressVelocity", () => {
	it("converts pixels per second into progress units per second", () => {
		expect(toProgressVelocity(6400, 320)).toBeCloseTo(20, 5);
		expect(toProgressVelocity(-6400, 320)).toBeCloseTo(-20, 5);
	});
});

describe("getPanReleaseHandoffVelocity", () => {
	it("applies the private safety cap after conversion", () => {
		expect(getPanReleaseHandoffVelocity(6400, 320)).toBeCloseTo(3.2, 5);
		expect(getPanReleaseHandoffVelocity(-6400, 320)).toBeCloseTo(-3.2, 5);
	});

	it("scales the release handoff before capping", () => {
		expect(getPanReleaseHandoffVelocity(800, 320, 0.5)).toBeCloseTo(1.25, 5);
		expect(getPanReleaseHandoffVelocity(800, 320, 2)).toBeCloseTo(3.2, 5);
	});
});

describe("getPinchReleaseHandoffVelocity", () => {
	it("treats pinch velocity as scale velocity and caps privately", () => {
		expect(getPinchReleaseHandoffVelocity(1.2)).toBeCloseTo(1.2, 5);
		expect(getPinchReleaseHandoffVelocity(8)).toBeCloseTo(3.2, 5);
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

	it("caps the returned magnitude using the private safety cap", () => {
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

		expect(result).toBeCloseTo(3.2, 5);
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

describe("resolveSensitivePanGestureEvent", () => {
	it("scales pan translation and velocity before release consumers read them", () => {
		const event = createEvent({
			translationX: 200,
			translationY: -80,
			velocityX: 1000,
			velocityY: -500,
		});

		const sensitiveEvent = resolveSensitivePanGestureEvent(event, {
			gestureSensitivity: 0.1,
		} as any);

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

		const sensitiveEvent = resolveSensitivePanGestureEvent(event, {
			gestureSensitivity: 0.1,
		} as any);

		expect(
			determineDismissal({
				event: sensitiveEvent,
				directions: createDirections({ horizontal: true }),
				dimensions,
				gestureVelocityImpact: 0,
			}).shouldDismiss,
		).toBe(false);
	});
});

describe("resolveSensitivePinchGestureEvent", () => {
	it("scales pinch scale delta and velocity before release consumers read them", () => {
		const event = {
			scale: 2,
			velocity: 4,
		} as any;

		const sensitiveEvent = resolveSensitivePinchGestureEvent(event, {
			gestureSensitivity: 0.25,
		} as any);

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

		const sensitiveEvent = resolveSensitivePinchGestureEvent(event, {
			gestureSensitivity: 0.5,
		} as any);

		expect(
			shouldDismissFromPinch(
				normalizePinchScale(sensitiveEvent.scale),
				true,
				false,
			),
		).toBe(false);
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
