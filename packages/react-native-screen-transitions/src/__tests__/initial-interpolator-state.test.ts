import { beforeAll, describe, expect, it, mock } from "bun:test";
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

mock.module("react", () => ({
	useMemo: <T>(factory: () => T) => factory(),
}));

mock.module("react-native", () => ({
	Platform: { OS: "ios" },
	useWindowDimensions: () => ({ width: 390, height: 844 }),
}));

mock.module("react-native-reanimated", () => ({
	clamp: (value: number, lower: number, upper: number) =>
		Math.min(Math.max(value, lower), upper),
	useDerivedValue: <T>() => ({ get: () => undefined as T }),
	useSharedValue: <T>(value: T) => ({
		get: () => value,
		set: () => {},
		modify: () => {},
	}),
}));

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

		const pipeline = useScreenAnimationPipeline();
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
