import { describe, expect, it } from "bun:test";
import { resolveCanTrackGesture } from "../providers/screen/gestures/helpers/resolve-can-track-gesture";

describe("resolveCanTrackGesture", () => {
	it("keeps first screens from tracking gestures", () => {
		expect(
			resolveCanTrackGesture({
				isFirstKey: true,
				canDismiss: true,
				hasSnapPoints: true,
				allowDisabledGestureTracking: true,
			}),
		).toBe(false);
	});

	it("preserves v3 disabled gesture behavior by default", () => {
		expect(
			resolveCanTrackGesture({
				isFirstKey: false,
				canDismiss: false,
				hasSnapPoints: false,
			}),
		).toBe(false);
	});

	it("keeps snap point gestures trackable under gestureEnabled false", () => {
		expect(
			resolveCanTrackGesture({
				isFirstKey: false,
				canDismiss: false,
				hasSnapPoints: true,
			}),
		).toBe(true);
	});

	it("opts disabled non-snap gestures into next live tracking behavior", () => {
		expect(
			resolveCanTrackGesture({
				isFirstKey: false,
				canDismiss: false,
				hasSnapPoints: false,
				allowDisabledGestureTracking: true,
			}),
		).toBe(true);
	});
});
