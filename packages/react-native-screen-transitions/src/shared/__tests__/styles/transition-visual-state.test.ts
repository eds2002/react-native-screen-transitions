import { describe, expect, it } from "bun:test";
import {
	hasCloseTransitionFinished,
	hasOpenTransitionStarted,
	isOpenTransitionBlocked,
} from "../../providers/screen/styles/helpers/transition-visual-state";

describe("transition visual state", () => {
	it("starts an opening transition only after blockers clear and progress advances", () => {
		expect(
			hasOpenTransitionStarted({
				pendingLifecycleStartBlockCount: 1,
				animationProgress: 0.1,
			}),
		).toBe(false);
		expect(
			hasOpenTransitionStarted({
				pendingLifecycleStartBlockCount: 0,
				animationProgress: 0,
			}),
		).toBe(false);
		expect(
			hasOpenTransitionStarted({
				pendingLifecycleStartBlockCount: 0,
				animationProgress: 0.001,
			}),
		).toBe(true);
	});

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
			hasCloseTransitionFinished({
				closing: 1,
				animationProgress: 0.001,
			}),
		).toBe(false);
	});

	it("finishes a closing transition at animation progress zero", () => {
		expect(
			hasCloseTransitionFinished({
				closing: 1,
				animationProgress: 0,
			}),
		).toBe(true);
	});

	it("does not finish a non-closing transition at animation progress zero", () => {
		expect(
			hasCloseTransitionFinished({
				closing: 0,
				animationProgress: 0,
			}),
		).toBe(false);
	});

	it("does not finish a closing transition below animation progress zero", () => {
		expect(
			hasCloseTransitionFinished({
				closing: 1,
				animationProgress: -0.001,
			}),
		).toBe(false);
	});
});
