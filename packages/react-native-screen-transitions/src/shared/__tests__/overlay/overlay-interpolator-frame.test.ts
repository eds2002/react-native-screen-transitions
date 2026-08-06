import { describe, expect, it } from "bun:test";
import { createOverlayInterpolatorFrame } from "../../components/overlay/helpers/create-overlay-interpolator-frame";
import type { ScreenInterpolatorFrame } from "../../providers/screen/animation/helpers/pipeline";

const createFrame = (key: string, progress: number) =>
	({
		current: {
			route: { key },
			progress,
			transitionProgress: progress,
			settled: progress === 1 ? 1 : 0,
			layouts: { screen: { width: 390, height: 844 } },
		},
		insets: { top: 0, right: 0, bottom: 0, left: 0 },
	}) as ScreenInterpolatorFrame;

describe("overlay interpolator frame", () => {
	it("presents sparse overlays as adjacent to the destination interpolator", () => {
		const frame = createOverlayInterpolatorFrame({
			overlayFrame: createFrame("A", 1),
			driverFrame: createFrame("C", 0.25),
		});

		expect(frame.current.route.key).toBe("A");
		expect(frame.next?.route.key).toBe("C");
		expect(frame.progress).toBe(1.25);
		expect(frame.active.route.key).toBe("C");
		expect(frame.inactive?.route.key).toBe("A");
	});

	it("presents the destination overlay as the focused current overlay", () => {
		const overlayFrame = createFrame("C", 0.25);
		const frame = createOverlayInterpolatorFrame({
			overlayFrame,
			driverFrame: overlayFrame,
			previousOverlayFrame: createFrame("A", 1),
		});

		expect(frame.previous?.route.key).toBe("A");
		expect(frame.current.route.key).toBe("C");
		expect(frame.next).toBeUndefined();
		expect(frame.progress).toBe(0.25);
		expect(frame.focused).toBe(true);
	});
});
