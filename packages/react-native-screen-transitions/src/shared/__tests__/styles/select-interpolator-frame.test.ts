import { describe, expect, it } from "bun:test";
import type { ScreenInterpolatorFrame } from "../../providers/screen/animation/helpers/pipeline";
import { selectInterpolatorFrame } from "../../providers/screen/styles/helpers/select-interpolator-frame";

describe("selectInterpolatorFrame", () => {
	it("promotes the current screen to a coherent focused frame in gesture mode", () => {
		const previous = { route: { key: "screen-a" } };
		const current = {
			route: { key: "screen-b" },
			progress: 0.4,
			transitionProgress: 0.45,
			settled: 0,
		};
		const next = {
			route: { key: "screen-c" },
			progress: 0.6,
		};
		const frame = {
			previous,
			current,
			next,
			progress: 1,
			transitionProgress: 1.05,
			focused: false,
			active: next,
			inactive: current,
			logicallySettled: 0,
		} as unknown as ScreenInterpolatorFrame;

		expect(selectInterpolatorFrame(frame, true)).toEqual({
			progress: 0.4,
			transitionProgress: 0.45,
			next: undefined,
			focused: true,
			active: current,
			inactive: previous,
			logicallySettled: 0,
		});
	});
});
