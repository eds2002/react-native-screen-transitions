import { describe, expect, it } from "bun:test";
import { resolveOffsetRules } from "../../../providers/motion/gestures/pan/activation/pan-activation-rules";
import { GestureActivationState } from "../../../types/gesture.types";

const horizontal = {
	horizontal: true,
	horizontalInverted: false,
	vertical: false,
	verticalInverted: false,
};
const dimensions = { width: 400, height: 800 };

describe("pan activation offsets", () => {
	it("judges the swipe by the finger's movement on screen, not relative to a moving screen", () => {
		// The screen under a closing one slides right faster than the finger: relative to the screen,
		// the finger moves left. On screen it moves right, which is what the person did.
		const result = resolveOffsetRules({
			initialTouch: { x: 60, y: 400, absoluteX: 60, absoluteY: 400 },
			touch: { x: 40, y: 400, absoluteX: 75, absoluteY: 400 },
			directions: horizontal,
			dimensions,
			activationState: GestureActivationState.PENDING,
		});

		expect(result.isSwipingRight).toBe(true);
		expect(result.nextActivationState).toBe(GestureActivationState.PASSED);
	});

	it("falls back to view coordinates when the event has no screen position", () => {
		const result = resolveOffsetRules({
			initialTouch: { x: 60, y: 400 },
			touch: { x: 40, y: 400 },
			directions: horizontal,
			dimensions,
			activationState: GestureActivationState.PENDING,
		});

		expect(result.isSwipingLeft).toBe(true);
		expect(result.nextActivationState).toBe(GestureActivationState.FAILED);
	});
});
