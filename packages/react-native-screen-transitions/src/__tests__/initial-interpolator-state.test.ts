import { afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { AnimationStore } from "../stores/animation.store";
import type { ScreenInterpolationProps } from "../types/animation.types";

const descriptors: {
	current: unknown;
	next: unknown;
	previous: unknown;
} = {
	current: undefined,
	next: undefined,
	previous: undefined,
};

mock.module("react-native-safe-area-context", () => ({
	useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

mock.module("../providers/stack/core.provider", () => ({
	useStackCoreStore: (selector: (state: any) => unknown) =>
		selector({ flags: { TRANSITIONS_ALWAYS_ON: false } }),
}));

mock.module("../providers/stack/blank-stack.provider", () => ({
	useBlankStackStore: (selector: (state: any) => unknown) =>
		selector({ routeKeys: [] }),
}));

mock.module("../providers/screen/descriptors", () => ({
	useDescriptorsStore: (
		selector: (state: { descriptors: typeof descriptors }) => unknown,
	) => selector({ descriptors }),
}));

let useScreenAnimationPipeline: typeof import("../providers/screen/animation/helpers/pipeline").useScreenAnimationPipeline;

describe("initial interpolator state", () => {
	afterEach(() => {
		AnimationStore.clearBag("home");
		AnimationStore.clearBag("details");
	});

	beforeAll(async () => {
		({ useScreenAnimationPipeline } = await import(
			"../providers/screen/animation/helpers/pipeline"
		));
	});

	it("exposes an entering pushed screen to the public interpolator", () => {
		let observedNext: ScreenInterpolationProps["next"];
		let pipeline: ReturnType<typeof useScreenAnimationPipeline> | undefined;

		descriptors.current = {
			route: { key: "home", name: "Home" },
			options: {},
		};
		descriptors.next = {
			route: { key: "details", name: "Details" },
			options: {
				enableTransitions: true,
				screenStyleInterpolator: ({ next }: ScreenInterpolationProps) => {
					observedNext = next;
					return null;
				},
			},
		};
		descriptors.previous = undefined;
		const nextAnimation = AnimationStore.getBag("details");
		nextAnimation.entering.set(1);
		nextAnimation.progressAnimating.set(1);
		nextAnimation.progressSettled.set(0);

		const TestComponent = () => {
			pipeline = useScreenAnimationPipeline();
			return null;
		};

		act(() => {
			create(React.createElement(TestComponent));
		});

		if (!pipeline) {
			throw new Error("Expected the animation pipeline to be initialized");
		}

		const props = pipeline.screenInterpolatorProps.get();

		pipeline.nextInterpolator?.({
			...props,
			bounds: {} as ScreenInterpolationProps["bounds"],
		});

		expect(observedNext).toMatchObject({
			progress: 0,
			transitionProgress: 0,
			entering: 1,
			animating: 1,
			closing: 0,
			willAnimate: 0,
			settled: 0,
			gesture: { dragging: 0, dismissing: 0, settling: 0 },
		});
	});
});
