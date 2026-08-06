import { describe, expect, it } from "bun:test";
import { runOverlaySlotInterpolator } from "../../components/overlay/helpers/run-overlay-slot-interpolator";
import type { ScreenInterpolatorFrame } from "../../providers/screen/animation/helpers/pipeline";
import type { ScreenTransitionAccessor } from "../../types/animation.types";

describe("overlay slot interpolator", () => {
	it("runs the destination interpolator against overlay adjacency", () => {
		const frame = {
			current: { route: { key: "A" }, progress: 1 },
			next: { route: { key: "C" }, progress: 0.25 },
			progress: 1.25,
			transitionProgress: 1.25,
			focused: false,
			active: { route: { key: "C" }, progress: 0.25 },
			inactive: { route: { key: "A" }, progress: 1 },
		} as ScreenInterpolatorFrame;

		const slot = runOverlaySlotInterpolator({
			frame,
			interpolator: ({ current, next, progress }) => {
				"worklet";
				return {
					overlay: {
						transform: [
							{
								translateX:
									current.route.key === "A" && next?.route.key === "C"
										? progress
										: -1,
							},
						],
					},
				};
			},
			transition: (() => null) as ScreenTransitionAccessor,
		});

		expect(slot?.style).toEqual({ transform: [{ translateX: 1.25 }] });
	});

	it("leaves an overlay unchanged when the driver has no overlay slot", () => {
		const frame = {
			current: { route: { key: "A" }, progress: 1 },
			next: { route: { key: "B" }, progress: 0.25 },
		} as ScreenInterpolatorFrame;

		expect(
			runOverlaySlotInterpolator({
				frame,
				interpolator: () => {
					"worklet";
					return { content: { opacity: 0.5 } };
				},
				transition: (() => null) as ScreenTransitionAccessor,
			}),
		).toBeUndefined();
	});
});
