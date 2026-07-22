import { describe, expect, it } from "bun:test";
import {
	isOpenTransitionBlocked,
	isTransitionVisuallyClosed,
} from "../../providers/screen/styles/helpers/transition-visual-state";

describe("transition visual state", () => {
	it("keeps an opening transition blocked until blockers clear and progress starts", () => {
		expect(
			isOpenTransitionBlocked({
				opening: true,
				pendingLifecycleStartBlockCount: 1,
				animationProgress: 0.1,
			}),
		).toBe(true);

		expect(
			isOpenTransitionBlocked({
				opening: true,
				pendingLifecycleStartBlockCount: 0,
				animationProgress: 0,
			}),
		).toBe(true);

		expect(
			isOpenTransitionBlocked({
				opening: true,
				pendingLifecycleStartBlockCount: 0,
				animationProgress: 0.001,
			}),
		).toBe(false);
	});

	it("does not detach while the closing animation clock is still moving", () => {
		expect(
			isTransitionVisuallyClosed({
				closing: 1,
				animationProgress: 0.001,
				targetProgress: 0,
			}),
		).toBe(false);
	});

	it("marks a committed close visually complete at terminal progress zero", () => {
		expect(
			isTransitionVisuallyClosed({
				closing: 1,
				animationProgress: 0,
				targetProgress: 0,
			}),
		).toBe(true);
	});

	it("does not treat a non-closing screen as visually closed", () => {
		expect(
			isTransitionVisuallyClosed({
				closing: 0,
				animationProgress: 0,
				targetProgress: 0,
			}),
		).toBe(false);
	});

	it("does not detach at the end of a decreasing snap above zero", () => {
		expect(
			isTransitionVisuallyClosed({
				closing: 1,
				animationProgress: 0,
				targetProgress: 0.5,
			}),
		).toBe(false);
	});
});
