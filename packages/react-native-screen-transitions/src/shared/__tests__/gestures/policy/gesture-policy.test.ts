import { describe, expect, it } from "bun:test";
import { resolveGestureCanTrack } from "../../../providers/screen/gestures/shared/policy";

describe("resolveGestureCanTrack", () => {
	it("keeps first screens from tracking gestures", () => {
		expect(
			resolveGestureCanTrack({
				isFirstKey: true,
				canDismiss: true,
				hasSnapPoints: true,
				allowDisabledGestureTracking: true,
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

	it("opts disabled non-snap gestures into next live tracking behavior", () => {
		expect(
			resolveGestureCanTrack({
				isFirstKey: false,
				canDismiss: false,
				hasSnapPoints: false,
				allowDisabledGestureTracking: true,
			}),
		).toBe(true);
	});
});
