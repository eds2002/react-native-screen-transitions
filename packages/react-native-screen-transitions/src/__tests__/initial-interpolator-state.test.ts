import { mountBuilderAnimationState } from "./helpers/mount-builder-animation-state";
import { afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { AnimationStore } from "../stores/animation.store";
import { GestureStore } from "../stores/gesture.store";
import { ScrollStore } from "../stores/scroll.store";
import type { BaseDescriptor } from "../providers/screen/builder";
import { buildScreenTransitionOptions } from "../providers/screen/motion/animation/helpers/build-screen-transition-options";
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
		selector({ flags: { TRANSITIONS_ALWAYS_ON: true } }),
	useOptionalStackCoreStore: (selector: (state: any) => unknown) =>
		selector({ flags: { TRANSITIONS_ALWAYS_ON: false } }),
}));

mock.module("../providers/stack/blank-stack.provider", () => ({
	useBlankStackStore: (selector: (state: any) => unknown) =>
		selector({ routeKeys: [], scenesByKey: {} }),
	useOptionalBlankStackStore: (selector: (state: any) => unknown) =>
		selector({ routeKeys: [] }),
}));

const currentSystem = mountBuilderAnimationState();
const nextSystem = mountBuilderAnimationState();
mock.module("../providers/screen/builder", () => ({
	useOptionalBuilderStore: (
		key: string | null,
		selector: (state: any) => unknown,
	) =>
		key
			? selector({
					animationState: key === "home" ? currentSystem : nextSystem,
				})
			: null,
	useBuilderStore: (
		selector: (state: { descriptors: typeof descriptors }) => unknown,
	) => {
		const value = {
			descriptors,
			derivations: { currentScreenKey: "home" },
			animationState: currentSystem,
		};
		return selector ? selector(value) : value;
	},
}));

function motionForKey(key: string) {
	const descriptor = Object.values(descriptors).find(
		(value) => (value as BaseDescriptor | undefined)?.route.key === key,
	) as BaseDescriptor;
	const system = key === "home" ? currentSystem : nextSystem;
	return {
		animations: {
			...AnimationStore.getBag(key),
			gesture: GestureStore.getBag(key),
			route: descriptor.route,
			options: buildScreenTransitionOptions(descriptor.options),
			targetProgress: system.targetProgress,
			resolvedAutoSnapPoint: system.resolvedAutoSnapPoint,
			measuredContentLayout: system.measuredContentLayout,
			scrollMetadata: ScrollStore.getValue(key, "metadata"),
			hasAutoSnapPoint: false,
			sortedNumericSnapPoints: [],
		},
	};
}
mock.module("../providers/screen/motion", () => ({
	useMotionStore: (selector: (state: any) => unknown) =>
		selector(motionForKey("home")),
	useOptionalMotionStore: (
		key: string | null,
		selector: (state: any) => unknown,
	) => (key ? selector(motionForKey(key)) : null),
}));

let useScreenAnimationPipeline: typeof import("../providers/screen/orchestrator/helpers/pipeline").useScreenAnimationPipeline;

describe("initial interpolator state", () => {
	afterEach(() => {
		AnimationStore.clearBag("home");
		AnimationStore.clearBag("details");
	});

	beforeAll(async () => {
		({ useScreenAnimationPipeline } = await import(
			"../providers/screen/orchestrator/helpers/pipeline"
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
