import { describe, expect, it } from "bun:test";
import {
	resolveGestureCanTrack,
	resolvePanPolicy,
	resolvePinchPolicy,
} from "../../../providers/screen/gestures/shared/policy";

describe("resolveGestureCanTrack", () => {
	it("keeps first screens from tracking gestures", () => {
		expect(
			resolveGestureCanTrack({
				isFirstKey: true,
				canDismiss: true,
				hasSnapPoints: true,
				gestureTracking: "always",
			}),
		).toBe(false);
	});

	it("preserves v3 disabled gesture behavior by default", () => {
		expect(
			resolveGestureCanTrack({
				isFirstKey: false,
				canDismiss: false,
				hasSnapPoints: false,
			}),
		).toBe(false);
	});

	it("keeps snap point gestures trackable under gestureEnabled false", () => {
		expect(
			resolveGestureCanTrack({
				isFirstKey: false,
				canDismiss: false,
				hasSnapPoints: true,
			}),
		).toBe(true);
	});

	it("opts disabled non-snap gestures into live tracking", () => {
		expect(
			resolveGestureCanTrack({
				isFirstKey: false,
				canDismiss: false,
				hasSnapPoints: false,
				gestureTracking: "always",
			}),
		).toBe(true);
	});

	it("lets never tracking override dismiss and snap gestures", () => {
		expect(
			resolveGestureCanTrack({
				isFirstKey: false,
				canDismiss: true,
				hasSnapPoints: true,
				gestureTracking: "never",
			}),
		).toBe(false);
	});
});

describe("gestureDirection activation areas", () => {
	it("uses structured pan direction areas instead of legacy gestureActivationArea", () => {
		const policy = resolvePanPolicy(
			{
				gestureDirection: [
					{ gesture: "vertical", area: "edge" },
					"horizontal",
				],
				gestureActivationArea: "edge",
			},
			false,
		);

		expect(policy.enabled).toBe(true);
		expect(policy.panActivationDirections).toEqual({
			vertical: true,
			verticalInverted: false,
			horizontal: true,
			horizontalInverted: false,
		});
		expect(policy.gestureActivationArea).toEqual({
			left: "screen",
			right: "screen",
			top: "edge",
			bottom: "screen",
		});
	});

	it("keeps legacy gestureActivationArea as fallback for string directions", () => {
		const policy = resolvePanPolicy(
			{
				gestureDirection: "vertical",
				gestureActivationArea: "edge",
			},
			false,
		);

		expect(policy.gestureActivationArea).toBe("edge");
	});

	it("supports numeric edge distance on structured pan directions", () => {
		const policy = resolvePanPolicy(
			{
				gestureDirection: { gesture: "horizontal", area: 32 },
			},
			false,
		);

		expect(policy.gestureActivationArea).toEqual({
			left: 32,
			right: "screen",
			top: "screen",
			bottom: "screen",
		});
	});

	it("ignores structured areas for pinch directions", () => {
		const options = {
			gestureDirection: { gesture: "pinch-in", area: "edge" },
		} as const;
		const panPolicy = resolvePanPolicy(options, false);
		const pinchPolicy = resolvePinchPolicy(options, false);

		expect(panPolicy.enabled).toBe(false);
		expect(panPolicy.gestureActivationArea).toEqual({
			left: "screen",
			right: "screen",
			top: "screen",
			bottom: "screen",
		});
		expect(pinchPolicy.enabled).toBe(true);
		expect(pinchPolicy.pinchInEnabled).toBe(true);
		expect(pinchPolicy.pinchOutEnabled).toBe(false);
	});
});
