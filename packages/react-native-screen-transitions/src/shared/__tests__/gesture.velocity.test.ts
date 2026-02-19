import { describe, expect, it } from "bun:test";
import { velocity } from "../utils/gesture/velocity";

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
		progress: { value: progress },
		closing: { value: 0 },
		animating: { value: 0 },
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

describe("velocity.normalize", () => {
	it("clamps values to the configured range", () => {
		expect(velocity.normalize(6400, 320)).toBeCloseTo(3.2, 5);
		expect(velocity.normalize(-6400, 320)).toBeCloseTo(-3.2, 5);
	});
});

describe("velocity.calculateProgressVelocity", () => {
	const dimensions = { width: 320, height: 640 };

	it("returns positive magnitude when progressing toward open target", () => {
		const animations = createAnimations(0.25);
		const event = createEvent({
			translationX: 48,
			translationY: 6,
			velocityX: 800,
		});

		const result = velocity.calculateProgressVelocity({
			animations: animations as any,
			shouldDismiss: false,
			event,
			dimensions,
			directions: createDirections({ horizontal: true }),
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

		const result = velocity.calculateProgressVelocity({
			animations: animations as any,
			shouldDismiss: true,
			event,
			dimensions,
			directions: createDirections({
				horizontal: true,
				verticalInverted: true,
			}),
		});

		expect(result).toBeLessThan(0);
		expect(Math.abs(result)).toBeCloseTo(1.406, 3);
	});

	it("caps the returned magnitude using clamp", () => {
		const animations = createAnimations(0.5);
		const event = createEvent({
			translationX: 10,
			velocityX: 5000,
		});

		const result = velocity.calculateProgressVelocity({
			animations: animations as any,
			shouldDismiss: false,
			event,
			dimensions,
			directions: createDirections({ horizontal: true }),
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

		const result = velocity.calculateProgressVelocity({
			animations: animations as any,
			shouldDismiss: true,
			event,
			dimensions,
			directions: createDirections({
				horizontal: true,
				vertical: true,
			}),
		});

		// Uses vertical candidate (96/640), not unsupported horizontal movement.
		expect(result).toBeCloseTo(-1, 5);
	});
});

describe("velocity.shouldPassDismissalThreshold", () => {
	const width = 320;

	it("returns true once translation alone crosses half the screen", () => {
		expect(velocity.shouldPassDismissalThreshold(170, 0, width, 0.3)).toBe(
			true,
		);
	});

	it("combines translation with weighted velocity", () => {
		expect(velocity.shouldPassDismissalThreshold(40, 2500, width, 0.5)).toBe(
			true,
		);
	});

	it("returns false when movement is negligible", () => {
		expect(velocity.shouldPassDismissalThreshold(0, 0, width, 0.3)).toBe(false);
	});
});
