import { afterEach, describe, expect, it } from "bun:test";
import { emit } from "../utils/animation/emit";

const originalRequestAnimationFrame = globalThis.requestAnimationFrame;

afterEach(() => {
	globalThis.requestAnimationFrame = originalRequestAnimationFrame;
});

describe("emit", () => {
	it("emits a one-frame pulse", () => {
		let current = 0;
		let nextFrame: FrameRequestCallback | null = null;

		globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
			nextFrame = callback;
			return 1;
		}) as typeof requestAnimationFrame;

		const willAnimate = {
			get: () => current,
			set: (value: number) => {
				current = value;
			},
		};

		emit(willAnimate as any, 1, 0);

		expect(current).toBe(1);
		expect(nextFrame).not.toBeNull();

		nextFrame?.(0);

		expect(current).toBe(0);
	});

	it("works with non-numeric shared values", () => {
		let current = "idle";
		let nextFrame: FrameRequestCallback | null = null;

		globalThis.requestAnimationFrame = ((callback: FrameRequestCallback) => {
			nextFrame = callback;
			return 1;
		}) as typeof requestAnimationFrame;

		const sharedValue = {
			get: () => current,
			set: (value: string) => {
				current = value;
			},
		};

		emit(sharedValue as any, "active", "idle");

		expect(current).toBe("active");
		expect(nextFrame).not.toBeNull();

		nextFrame?.(0);

		expect(current).toBe("idle");
	});
});
