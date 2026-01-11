import { describe, expect, it } from "bun:test";
import {
	normalizeSides,
	computeEdgeConstraints,
	calculateSwipeDirs,
	shouldActivateOrFail,
	checkScrollAwareActivation,
} from "../utils/gesture/check-gesture-activation";

describe("normalizeSides", () => {
	it("returns all sides as 'screen' when no area provided", () => {
		const result = normalizeSides();
		expect(result).toEqual({
			left: "screen",
			right: "screen",
			top: "screen",
			bottom: "screen",
		});
	});

	it("normalizes string input to all sides", () => {
		const result = normalizeSides("edge");
		expect(result).toEqual({
			left: "edge",
			right: "edge",
			top: "edge",
			bottom: "edge",
		});
	});

	it("handles per-side object input", () => {
		const result = normalizeSides({
			left: "edge",
			right: "screen",
			top: "edge",
		});
		expect(result).toEqual({
			left: "edge",
			right: "screen",
			top: "edge",
			bottom: "screen", // defaults to screen
		});
	});

	it("defaults missing sides to screen", () => {
		const result = normalizeSides({ left: "edge" });
		expect(result.left).toBe("edge");
		expect(result.right).toBe("screen");
		expect(result.top).toBe("screen");
		expect(result.bottom).toBe("screen");
	});
});

describe("computeEdgeConstraints", () => {
	const dimensions = { width: 375, height: 812 };
	const allScreen = { left: "screen", right: "screen", top: "screen", bottom: "screen" } as const;
	const allEdge = { left: "edge", right: "edge", top: "edge", bottom: "edge" } as const;

	it("allows all directions when all sides are 'screen'", () => {
		const result = computeEdgeConstraints({ x: 200, y: 400 }, dimensions, allScreen);
		expect(result.horizontalRight).toBe(true);
		expect(result.horizontalLeft).toBe(true);
		expect(result.verticalDown).toBe(true);
		expect(result.verticalUp).toBe(true);
	});

	it("restricts to left edge for horizontal-right when edge mode", () => {
		// Touch at x=200 (center) should NOT allow right swipe with edge activation
		const center = computeEdgeConstraints({ x: 200, y: 400 }, dimensions, allEdge);
		expect(center.horizontalRight).toBe(false);

		// Touch at x=30 (within 50px edge) should allow right swipe
		const edge = computeEdgeConstraints({ x: 30, y: 400 }, dimensions, allEdge);
		expect(edge.horizontalRight).toBe(true);
	});

	it("restricts to right edge for horizontal-left when edge mode", () => {
		// Touch at x=200 (center) should NOT allow left swipe
		const center = computeEdgeConstraints({ x: 200, y: 400 }, dimensions, allEdge);
		expect(center.horizontalLeft).toBe(false);

		// Touch at x=350 (within 50px of right edge) should allow left swipe
		const edge = computeEdgeConstraints({ x: 350, y: 400 }, dimensions, allEdge);
		expect(edge.horizontalLeft).toBe(true);
	});

	it("restricts to top edge for vertical-down when edge mode", () => {
		// Touch at y=400 (center) should NOT allow down swipe
		const center = computeEdgeConstraints({ x: 200, y: 400 }, dimensions, allEdge);
		expect(center.verticalDown).toBe(false);

		// Touch at y=100 (within 135px edge) should allow down swipe
		const edge = computeEdgeConstraints({ x: 200, y: 100 }, dimensions, allEdge);
		expect(edge.verticalDown).toBe(true);
	});

	it("uses custom responseDistance", () => {
		// With custom distance of 100px
		const result = computeEdgeConstraints({ x: 80, y: 400 }, dimensions, allEdge, 100);
		expect(result.horizontalRight).toBe(true); // 80 < 100
	});
});

describe("calculateSwipeDirs", () => {
	it("detects horizontal swipe right", () => {
		const result = calculateSwipeDirs(50, 10);
		expect(result.isHorizontalSwipe).toBe(true);
		expect(result.isVerticalSwipe).toBe(false);
		expect(result.isSwipingRight).toBe(true);
		expect(result.isSwipingLeft).toBe(false);
	});

	it("detects horizontal swipe left", () => {
		const result = calculateSwipeDirs(-50, 10);
		expect(result.isHorizontalSwipe).toBe(true);
		expect(result.isSwipingLeft).toBe(true);
		expect(result.isSwipingRight).toBe(false);
	});

	it("detects vertical swipe down", () => {
		const result = calculateSwipeDirs(10, 50);
		expect(result.isVerticalSwipe).toBe(true);
		expect(result.isHorizontalSwipe).toBe(false);
		expect(result.isSwipingDown).toBe(true);
		expect(result.isSwipingUp).toBe(false);
	});

	it("detects vertical swipe up", () => {
		const result = calculateSwipeDirs(10, -50);
		expect(result.isVerticalSwipe).toBe(true);
		expect(result.isSwipingUp).toBe(true);
		expect(result.isSwipingDown).toBe(false);
	});

	it("horizontal wins when equal deltas", () => {
		// When deltaX === deltaY, neither wins (both false)
		const result = calculateSwipeDirs(50, 50);
		expect(result.isHorizontalSwipe).toBe(false);
		expect(result.isVerticalSwipe).toBe(false);
	});
});

describe("shouldActivateOrFail", () => {
	const baseParams = {
		deltaX: 0,
		deltaY: 0,
		hasHorizontal: true,
		hasVertical: true,
		isHorizontalSwipe: false,
		isVerticalSwipe: false,
		allowedRight: true,
		allowedLeft: true,
		allowedUp: true,
		allowedDown: true,
		horizontalGateRight: true,
		horizontalGateLeft: true,
		verticalGateUp: true,
		verticalGateDown: true,
		isSwipingRight: false,
		isSwipingLeft: false,
		isSwipingUp: false,
		isSwipingDown: false,
	};

	it("activates on valid horizontal right swipe", () => {
		const result = shouldActivateOrFail({
			...baseParams,
			deltaX: 15, // above threshold (10)
			deltaY: 5, // within tolerance (15)
			isHorizontalSwipe: true,
			isSwipingRight: true,
		});
		expect(result.shouldActivate).toBe(true);
		expect(result.shouldFail).toBe(false);
	});

	it("activates on valid vertical down swipe", () => {
		const result = shouldActivateOrFail({
			...baseParams,
			deltaX: 5, // within tolerance (20)
			deltaY: 15, // above threshold (10)
			isVerticalSwipe: true,
			isSwipingDown: true,
		});
		expect(result.shouldActivate).toBe(true);
		expect(result.shouldFail).toBe(false);
	});

	it("fails when swiping in disallowed direction", () => {
		const result = shouldActivateOrFail({
			...baseParams,
			deltaX: 15,
			deltaY: 5,
			isHorizontalSwipe: true,
			isSwipingRight: true,
			allowedRight: false, // direction not allowed
		});
		expect(result.shouldActivate).toBe(false);
		expect(result.shouldFail).toBe(true);
	});

	it("fails when edge gate blocks the swipe", () => {
		const result = shouldActivateOrFail({
			...baseParams,
			deltaX: 15,
			deltaY: 5,
			isHorizontalSwipe: true,
			isSwipingRight: true,
			horizontalGateRight: false, // edge gate blocks
		});
		expect(result.shouldActivate).toBe(false);
		expect(result.shouldFail).toBe(true);
	});

	it("fails when vertical deviation exceeds tolerance during horizontal swipe", () => {
		const result = shouldActivateOrFail({
			...baseParams,
			deltaX: 15,
			deltaY: 20, // exceeds GESTURE_FAIL_TOLERANCE_X (15)
			isHorizontalSwipe: true,
			isSwipingRight: true,
		});
		expect(result.shouldActivate).toBe(false);
		expect(result.shouldFail).toBe(true);
	});

	it("does not activate when movement is below threshold", () => {
		const result = shouldActivateOrFail({
			...baseParams,
			deltaX: 5, // below threshold (10)
			deltaY: 2,
			isHorizontalSwipe: true,
			isSwipingRight: true,
		});
		expect(result.shouldActivate).toBe(false);
		expect(result.shouldFail).toBe(false);
	});

	it("handles bidirectional gesture activation", () => {
		// Both horizontal and vertical allowed, vertical swipe detected
		const result = shouldActivateOrFail({
			...baseParams,
			hasHorizontal: true,
			hasVertical: true,
			deltaX: 5,
			deltaY: 15,
			isVerticalSwipe: true,
			isSwipingDown: true,
		});
		expect(result.shouldActivate).toBe(true);
	});
});

describe("checkScrollAwareActivation", () => {
	const baseDirections = {
		vertical: true,
		verticalInverted: false,
		horizontal: false,
		horizontalInverted: false,
	};

	const noSwipe = {
		isSwipingDown: false,
		isSwipingUp: false,
		isSwipingRight: false,
		isSwipingLeft: false,
	};

	describe("vertical sheet (dismiss down)", () => {
		it("activates when swiping down at scroll top", () => {
			const result = checkScrollAwareActivation({
				swipeInfo: { ...noSwipe, isSwipingDown: true },
				directions: baseDirections,
				scrollX: 0,
				scrollY: 0,
				maxScrollX: 0,
				maxScrollY: 500,
			});
			expect(result.shouldActivate).toBe(true);
			expect(result.direction).toBe("vertical");
		});

		it("does not activate when swiping down but scroll is not at top", () => {
			const result = checkScrollAwareActivation({
				swipeInfo: { ...noSwipe, isSwipingDown: true },
				directions: baseDirections,
				scrollX: 0,
				scrollY: 100,
				maxScrollX: 0,
				maxScrollY: 500,
			});
			expect(result.shouldActivate).toBe(false);
		});

		it("does not activate when swiping up without snap points", () => {
			const result = checkScrollAwareActivation({
				swipeInfo: { ...noSwipe, isSwipingUp: true },
				directions: baseDirections,
				scrollX: 0,
				scrollY: 0,
				maxScrollX: 0,
				maxScrollY: 500,
			});
			expect(result.shouldActivate).toBe(false);
		});
	});

	describe("vertical inverted sheet (dismiss up)", () => {
		const invertedDirections = {
			vertical: false,
			verticalInverted: true,
			horizontal: false,
			horizontalInverted: false,
		};

		it("activates when swiping up at scroll bottom", () => {
			const result = checkScrollAwareActivation({
				swipeInfo: { ...noSwipe, isSwipingUp: true },
				directions: invertedDirections,
				scrollX: 0,
				scrollY: 500,
				maxScrollX: 0,
				maxScrollY: 500,
			});
			expect(result.shouldActivate).toBe(true);
			expect(result.direction).toBe("vertical-inverted");
		});

		it("does not activate when swiping up but scroll is not at bottom", () => {
			const result = checkScrollAwareActivation({
				swipeInfo: { ...noSwipe, isSwipingUp: true },
				directions: invertedDirections,
				scrollX: 0,
				scrollY: 200,
				maxScrollX: 0,
				maxScrollY: 500,
			});
			expect(result.shouldActivate).toBe(false);
		});
	});

	describe("horizontal sheet (dismiss right)", () => {
		const horizontalDirections = {
			vertical: false,
			verticalInverted: false,
			horizontal: true,
			horizontalInverted: false,
		};

		it("activates when swiping right at scroll left edge", () => {
			const result = checkScrollAwareActivation({
				swipeInfo: { ...noSwipe, isSwipingRight: true },
				directions: horizontalDirections,
				scrollX: 0,
				scrollY: 0,
				maxScrollX: 500,
				maxScrollY: 0,
			});
			expect(result.shouldActivate).toBe(true);
			expect(result.direction).toBe("horizontal");
		});

		it("does not activate when scroll is not at left edge", () => {
			const result = checkScrollAwareActivation({
				swipeInfo: { ...noSwipe, isSwipingRight: true },
				directions: horizontalDirections,
				scrollX: 100,
				scrollY: 0,
				maxScrollX: 500,
				maxScrollY: 0,
			});
			expect(result.shouldActivate).toBe(false);
		});
	});

	describe("horizontal inverted sheet (dismiss left)", () => {
		const invertedHorizontalDirections = {
			vertical: false,
			verticalInverted: false,
			horizontal: false,
			horizontalInverted: true,
		};

		it("activates when swiping left at scroll right edge", () => {
			const result = checkScrollAwareActivation({
				swipeInfo: { ...noSwipe, isSwipingLeft: true },
				directions: invertedHorizontalDirections,
				scrollX: 500,
				scrollY: 0,
				maxScrollX: 500,
				maxScrollY: 0,
			});
			expect(result.shouldActivate).toBe(true);
			expect(result.direction).toBe("horizontal-inverted");
		});
	});

	describe("snap points behavior", () => {
		it("activates for swipe up (expand) at scroll top when hasSnapPoints and canExpandMore", () => {
			const result = checkScrollAwareActivation({
				swipeInfo: { ...noSwipe, isSwipingUp: true },
				directions: baseDirections,
				scrollX: 0,
				scrollY: 0,
				maxScrollX: 0,
				maxScrollY: 500,
				hasSnapPoints: true,
				canExpandMore: true,
			});
			expect(result.shouldActivate).toBe(true);
			expect(result.direction).toBe("vertical-inverted");
		});

		it("does not activate for swipe up when canExpandMore is false", () => {
			const result = checkScrollAwareActivation({
				swipeInfo: { ...noSwipe, isSwipingUp: true },
				directions: baseDirections,
				scrollX: 0,
				scrollY: 0,
				maxScrollX: 0,
				maxScrollY: 500,
				hasSnapPoints: true,
				canExpandMore: false,
			});
			expect(result.shouldActivate).toBe(false);
		});

		it("does not activate for swipe up when scroll is not at top", () => {
			const result = checkScrollAwareActivation({
				swipeInfo: { ...noSwipe, isSwipingUp: true },
				directions: baseDirections,
				scrollX: 0,
				scrollY: 100,
				maxScrollX: 0,
				maxScrollY: 500,
				hasSnapPoints: true,
				canExpandMore: true,
			});
			expect(result.shouldActivate).toBe(false);
		});

		it("activates for swipe left (expand) on horizontal sheet with snap points", () => {
			const horizontalDirections = {
				vertical: false,
				verticalInverted: false,
				horizontal: true,
				horizontalInverted: false,
			};

			const result = checkScrollAwareActivation({
				swipeInfo: { ...noSwipe, isSwipingLeft: true },
				directions: horizontalDirections,
				scrollX: 0,
				scrollY: 0,
				maxScrollX: 500,
				maxScrollY: 0,
				hasSnapPoints: true,
				canExpandMore: true,
			});
			expect(result.shouldActivate).toBe(true);
			expect(result.direction).toBe("horizontal-inverted");
		});
	});

	describe("no activation cases", () => {
		it("returns false when no swipe is detected", () => {
			const result = checkScrollAwareActivation({
				swipeInfo: noSwipe,
				directions: baseDirections,
				scrollX: 0,
				scrollY: 0,
				maxScrollX: 0,
				maxScrollY: 500,
			});
			expect(result.shouldActivate).toBe(false);
			expect(result.direction).toBe(null);
		});

		it("returns false when direction is disabled", () => {
			const disabledDirections = {
				vertical: false,
				verticalInverted: false,
				horizontal: false,
				horizontalInverted: false,
			};

			const result = checkScrollAwareActivation({
				swipeInfo: { ...noSwipe, isSwipingDown: true },
				directions: disabledDirections,
				scrollX: 0,
				scrollY: 0,
				maxScrollX: 0,
				maxScrollY: 500,
			});
			expect(result.shouldActivate).toBe(false);
		});
	});
});
