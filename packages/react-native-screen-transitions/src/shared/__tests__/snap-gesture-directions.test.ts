import { describe, expect, it } from "bun:test";
import { resolveGestureDrivenProgress } from "../providers/screen/animation/helpers/hydrate-transition-state/gesture-progress";
import {
	getPanActivationDirections,
	getPanSnapAxisDirections,
	getSnapPinchDirectionConfig,
} from "../providers/screen/gestures/helpers/gesture-directions";
import type { ScreenTransitionOptions } from "../types/animation.types";
import type { GestureDirection } from "../types/gesture.types";

const createGesture = (
	overrides: Partial<{
		normX: number;
		normY: number;
		normScale: number;
		active: string | null;
	}>,
) =>
	({
		x: 0,
		y: 0,
		normX: overrides.normX ?? 0,
		normY: overrides.normY ?? 0,
		scale: 1,
		normScale: overrides.normScale ?? 0,
		focalX: 0,
		focalY: 0,
		raw: {
			x: 0,
			y: 0,
			normX: 0,
			normY: 0,
			scale: 1,
			normScale: 0,
		},
		dismissing: 0,
		dragging: 0,
		settling: 0,
		active: overrides.active ?? null,
		direction: overrides.active ?? null,
		normalizedX: overrides.normX ?? 0,
		normalizedY: overrides.normY ?? 0,
		isDismissing: 0,
		isDragging: 0,
	}) as any;

const resolveSnapProgress = (
	baseProgress: number,
	gestureDirection: GestureDirection | GestureDirection[],
	gesture: ReturnType<typeof createGesture>,
	snapBounds = { min: 0, max: 1 },
) =>
	resolveGestureDrivenProgress(
		baseProgress,
		gesture,
		{
			gestureDirection,
			gestureDrivesProgress: true,
		} as ScreenTransitionOptions,
		undefined,
		snapBounds,
	);

describe("snap gesture directions", () => {
	it("enables both activation directions for every configured snap pan axis", () => {
		const directions = getPanActivationDirections({
			gestureDirection: ["horizontal", "vertical"],
			hasSnapPoints: true,
		});

		expect(directions.horizontal).toBe(true);
		expect(directions.horizontalInverted).toBe(true);
		expect(directions.vertical).toBe(true);
		expect(directions.verticalInverted).toBe(true);
	});

	it("uses the first direction on each pan axis as collapse", () => {
		const snapAxisDirections = getPanSnapAxisDirections([
			"horizontal",
			"vertical-inverted",
			"vertical",
		]);

		expect(snapAxisDirections.horizontal?.collapse).toBe("horizontal");
		expect(snapAxisDirections.horizontal?.expand).toBe("horizontal-inverted");
		expect(snapAxisDirections.vertical?.collapse).toBe("vertical-inverted");
		expect(snapAxisDirections.vertical?.expand).toBe("vertical");
	});

	it("maps each active pan snap direction to collapse or expand progress", () => {
		expect(
			resolveSnapProgress(
				1,
				["horizontal", "vertical-inverted"],
				createGesture({ active: "horizontal", normX: 0.1 }),
			),
		).toBe(0.9);

		expect(
			resolveSnapProgress(
				1,
				["horizontal", "vertical-inverted"],
				createGesture({ active: "vertical-inverted", normY: -0.1 }),
			),
		).toBe(0.9);
	});

	it("clamps active pan snap progress to the resolved snap bounds", () => {
		expect(
			resolveSnapProgress(
				0.3,
				"horizontal",
				createGesture({ active: "horizontal", normX: 0.25 }),
				{ min: 0.2, max: 0.6 },
			),
		).toBe(0.2);

		expect(
			resolveSnapProgress(
				0.55,
				"horizontal",
				createGesture({ active: "horizontal-inverted", normX: -0.25 }),
				{ min: 0.2, max: 0.6 },
			),
		).toBe(0.6);
	});

	it("uses the first pinch direction as collapse", () => {
		expect(getSnapPinchDirectionConfig(["pinch-out", "pinch-in"])).toEqual({
			collapse: "pinch-out",
			expand: "pinch-in",
		});
	});

	it("maps first pinch snap direction to collapse and the inverse to expand", () => {
		expect(
			resolveSnapProgress(
				1,
				"pinch-out",
				createGesture({ active: "pinch-out", normScale: 0.2 }),
			),
		).toBe(0.8);

		expect(
			resolveSnapProgress(
				0.5,
				"pinch-out",
				createGesture({ active: "pinch-in", normScale: -0.2 }),
			),
		).toBe(0.7);
	});
});
