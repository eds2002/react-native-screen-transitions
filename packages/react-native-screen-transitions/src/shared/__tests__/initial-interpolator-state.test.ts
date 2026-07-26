import { beforeAll, describe, expect, it, mock } from "bun:test";
import React from "react";
import { act, create } from "react-test-renderer";
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

mock.module("../hooks/navigation/use-stack", () => ({
	useStack: () => false,
}));

mock.module("../providers/screen/descriptors", () => ({
	useDescriptorsStore: (selector: (state: typeof descriptors) => unknown) =>
		selector(descriptors),
}));

mock.module(
	"../providers/screen/animation/helpers/use-build-transition-state",
	() => ({
		useBuildTransitionState: () => undefined,
	}),
);

let useScreenAnimationPipeline: typeof import("../providers/screen/animation/helpers/pipeline").useScreenAnimationPipeline;

describe("initial interpolator state", () => {
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
				screenStyleInterpolator: ({ next }: ScreenInterpolationProps) => {
					observedNext = next;
					return null;
				},
			},
		};
		descriptors.previous = undefined;

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
			transition: () => null,
		});

		expect(observedNext).toMatchObject({
			progress: 0,
			transitionProgress: 0,
			entering: 1,
			animating: 1,
			closing: 0,
			willAnimate: 0,
			settled: 0,
			logicallySettled: 0,
			gesture: { dragging: 0, dismissing: 0, settling: 0 },
		});
	});
});
