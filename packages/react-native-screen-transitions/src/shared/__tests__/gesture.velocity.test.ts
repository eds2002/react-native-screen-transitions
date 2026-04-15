import { describe, expect, it } from "bun:test";
import {
	getPanReleaseHandoffVelocity,
	getPanReleaseProgressVelocity,
	getPinchReleaseHandoffVelocity,
	shouldDismissFromProjection,
	toProgressVelocity,
} from "../providers/screen/gestures/helpers/gesture-physics";

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
