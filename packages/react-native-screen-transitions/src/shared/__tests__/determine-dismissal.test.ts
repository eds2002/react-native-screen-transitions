import { describe, expect, it, mock } from "bun:test";

mock.module("react-native", () => ({}));
mock.module("react-native-gesture-handler", () => ({}));
mock.module("react-native-reanimated", () => ({
	clamp: (value: number, lower: number, upper: number) =>
		Math.min(Math.max(value, lower), upper),
}));

const { determineDismissal } = await import(
	"../utils/gesture/determine-dismissal"
);

describe("determineDismissal", () => {
	const dimensions = { width: 320, height: 640 };

	it("dismisses when horizontal translation exceeds the threshold", () => {
		const { shouldDismiss } = determineDismissal({
			event: {
				translationX: 170,
				translationY: 0,
				velocityX: 0,
				velocityY: 0,
			},
			directions: {
				vertical: false,
				verticalInverted: false,
				horizontal: true,
				horizontalInverted: false,
			},
			dimensions,
			gestureVelocityImpact: 0.3,
		});

		expect(shouldDismiss).toBe(true);
	});

	it("ignores movement in disallowed directions", () => {
		const { shouldDismiss } = determineDismissal({
			event: {
				translationX: 200,
				translationY: 0,
				velocityX: 0,
				velocityY: 0,
			},
			directions: {
				vertical: true,
				verticalInverted: false,
				horizontal: false,
				horizontalInverted: false,
			},
			dimensions,
			gestureVelocityImpact: 0.3,
		});

		expect(shouldDismiss).toBe(false);
	});

	it("dismisses vertical gestures when velocity pushes the projection past the threshold", () => {
		const { shouldDismiss } = determineDismissal({
			event: {
				translationX: 0,
				translationY: 40,
				velocityX: 0,
				velocityY: 1800,
			},
			directions: {
				vertical: true,
				verticalInverted: false,
				horizontal: false,
				horizontalInverted: false,
			},
			dimensions,
			gestureVelocityImpact: 0.3,
		});

		expect(shouldDismiss).toBe(true);
	});

	it("respects inverted horizontal directions", () => {
		const { shouldDismiss } = determineDismissal({
			event: {
				translationX: -160,
				translationY: 0,
				velocityX: -700,
				velocityY: 0,
			},
			directions: {
				vertical: false,
				verticalInverted: false,
				horizontal: false,
				horizontalInverted: true,
			},
			dimensions,
			gestureVelocityImpact: 0.25,
		});

		expect(shouldDismiss).toBe(true);
	});

	it("returns false when movement never exceeds the composite threshold", () => {
		const { shouldDismiss } = determineDismissal({
			event: {
				translationX: 30,
				translationY: 0,
				velocityX: 100,
				velocityY: 0,
			},
			directions: {
				vertical: false,
				verticalInverted: false,
				horizontal: true,
				horizontalInverted: false,
			},
			dimensions,
			gestureVelocityImpact: 0.2,
		});

		expect(shouldDismiss).toBe(false);
	});
});
