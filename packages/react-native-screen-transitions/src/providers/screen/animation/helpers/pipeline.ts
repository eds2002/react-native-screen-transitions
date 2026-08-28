import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
	type DerivedValue,
	type SharedValue,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	createScreenTransitionState,
	DEFAULT_SCREEN_TRANSITION_STATE,
} from "../../../../constants";
import { AnimationStore } from "../../../../stores/animation.store";
import type {
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
	ScreenTransitionState,
} from "../../../../types/animation.types";
import { useBlankStackStore } from "../../../stack/blank-stack.provider";
import { useStackCoreStore } from "../../../stack/core.provider";
import { type BaseDescriptor, useDescriptorsStore } from "../../descriptors";
import { buildScreenTransitionOptions } from "./build-screen-transition-options";
import { updateDerivations } from "./derivations";
import { hasTransitionsEnabled } from "./has-transitions-enabled";
import { hydrateTransitionState } from "./hydrate-transition-state";
import type { SelectedInterpolatorOptions } from "./selected-interpolator-options";
import { readStackProgress, type StackProgressEntry } from "./stack-progress";
import { useBuildTransitionState } from "./use-build-transition-state";
import { toPlainRoute, toPlainValue } from "./worklet";

export type ScreenInterpolatorFrame = Omit<
	ScreenInterpolationProps,
	"bounds" | "transition"
>;

export interface ScreenAnimationPipeline {
	screenInterpolatorProps: DerivedValue<ScreenInterpolatorFrame>;
	selectedInterpolatorOptions: SharedValue<SelectedInterpolatorOptions>;
	nextInterpolator: ScreenStyleInterpolator | undefined;
	currentInterpolator: ScreenStyleInterpolator | undefined;
}

const getInitialSettledProgress = (descriptor: BaseDescriptor) => {
	const { snapPoints, initialSnapIndex = 0 } = descriptor.options;

	if (!snapPoints?.length) {
		return 1;
	}

	const clampedIndex = Math.min(
		Math.max(0, initialSnapIndex),
		snapPoints.length - 1,
	);
	const snapPoint = snapPoints[clampedIndex];

	return typeof snapPoint === "number" ? snapPoint : 0;
};

const applyInitialProgress = ({
	state,
	dimensions,
	progress,
	entering = 0,
	closing = 0,
	animating = 0,
	willAnimate = 0,
	settled = entering || closing || animating ? 0 : 1,
}: {
	state: ScreenTransitionState;
	dimensions: ScreenInterpolatorFrame["layouts"]["screen"];
	progress: number;
	entering?: number;
	closing?: number;
	animating?: number;
	willAnimate?: number;
	settled?: number;
}) => {
	state.progress = progress;
	state.transitionProgress = progress;
	state.entering = entering;
	state.closing = closing;
	state.animating = animating;
	state.willAnimate = willAnimate;
	state.settled = settled;
	state.layouts.screen = dimensions;

	return state;
};

const createInitialTransitionState = ({
	descriptor,
	dimensions,
	progress,
	entering,
	animating,
	willAnimate,
	settled,
}: {
	descriptor: BaseDescriptor;
	dimensions: ScreenInterpolatorFrame["layouts"]["screen"];
	progress: number;
	entering?: number;
	animating?: number;
	willAnimate?: number;
	settled?: number;
}) => {
	const meta = descriptor.options.meta
		? (toPlainValue(descriptor.options.meta) as Record<string, unknown>)
		: undefined;
	const state = createScreenTransitionState(
		toPlainRoute(descriptor.route),
		meta,
		buildScreenTransitionOptions(descriptor.options),
	);

	return applyInitialProgress({
		state,
		dimensions,
		progress,
		entering,
		animating,
		willAnimate,
		settled,
	});
};

const createInitialInterpolatorProps = ({
	dimensions,
	insets,
	currentDescriptor,
	nextDescriptor,
	prevDescriptor,
}: {
	dimensions: ScreenInterpolatorFrame["layouts"]["screen"];
	insets: ScreenInterpolatorFrame["insets"];
	currentDescriptor: BaseDescriptor;
	nextDescriptor?: BaseDescriptor;
	prevDescriptor?: BaseDescriptor;
}): ScreenInterpolatorFrame => {
	const hasIncomingNext = !!nextDescriptor;
	const isFocusedEntering = !!prevDescriptor && !nextDescriptor;
	const shouldAnimateInitialMount =
		!prevDescriptor &&
		!nextDescriptor &&
		!!currentDescriptor.options.experimental_animateOnInitialMount;
	const currentProgress =
		hasIncomingNext || (!isFocusedEntering && !shouldAnimateInitialMount)
			? getInitialSettledProgress(currentDescriptor)
			: 0;
	const currentEntering =
		isFocusedEntering || shouldAnimateInitialMount ? 1 : 0;
	const current = createInitialTransitionState({
		descriptor: currentDescriptor,
		dimensions,
		progress: currentProgress,
		entering: currentEntering,
		animating: currentEntering,
		willAnimate: 0,
	});
	const previous = prevDescriptor
		? createInitialTransitionState({
				descriptor: prevDescriptor,
				dimensions,
				progress: getInitialSettledProgress(prevDescriptor),
			})
		: undefined;
	const next = nextDescriptor
		? createInitialTransitionState({
				descriptor: nextDescriptor,
				dimensions,
				progress: 0,
				entering: 1,
				animating: 1,
				willAnimate: 0,
				settled: 0,
			})
		: undefined;
	const frame: ScreenInterpolatorFrame = {
		layouts: current.layouts,
		insets,
		previous,
		current,
		next,
		progress: 0,
		transitionProgress: 0,
		stackProgress: 0,
		focused: true,
		active: current,
		inactive: undefined,
	};

	updateDerivations(frame);
	frame.stackProgress = frame.progress;

	return frame;
};

type BuiltTransitionState = NonNullable<
	ReturnType<typeof useBuildTransitionState>
>;

const hydrateInterpolatorFrame = <TFrame extends ScreenInterpolatorFrame>({
	frame,
	dimensions,
	insets,
	currentAnimation,
	nextAnimation,
	prevAnimation,
	nextHasTransitions,
	interpolatorOptions,
	stackProgressEntries,
	currentRouteKey,
}: {
	frame: TFrame;
	dimensions: ScreenInterpolatorFrame["layouts"]["screen"];
	insets: ScreenInterpolatorFrame["insets"];
	currentAnimation: BuiltTransitionState | undefined;
	nextAnimation: BuiltTransitionState | undefined;
	prevAnimation: BuiltTransitionState | undefined;
	nextHasTransitions: boolean;
	interpolatorOptions: SelectedInterpolatorOptions;
	stackProgressEntries: readonly StackProgressEntry[];
	currentRouteKey: string;
}): TFrame => {
	"worklet";
	const shouldApplyOptionsToCurrent = interpolatorOptions.owner === "current";
	const shouldApplyOptionsToNext =
		interpolatorOptions.owner === "next" &&
		!!nextAnimation &&
		nextHasTransitions;
	frame.previous = prevAnimation
		? hydrateTransitionState(prevAnimation, dimensions)
		: undefined;

	frame.current = currentAnimation
		? hydrateTransitionState(
				currentAnimation,
				dimensions,
				shouldApplyOptionsToCurrent ? interpolatorOptions.options : undefined,
			)
		: DEFAULT_SCREEN_TRANSITION_STATE;

	frame.next =
		nextAnimation && nextHasTransitions
			? hydrateTransitionState(
					nextAnimation,
					dimensions,
					shouldApplyOptionsToNext ? interpolatorOptions.options : undefined,
				)
			: undefined;

	frame.layouts = frame.current.layouts;
	frame.insets = insets;

	updateDerivations(frame);

	frame.stackProgress = readStackProgress(
		stackProgressEntries,
		currentRouteKey,
		frame.progress,
	);

	return frame;
};

export function useScreenAnimationPipeline(): ScreenAnimationPipeline {
	const transitionsAlwaysOn = useStackCoreStore(
		(store) => store.flags.TRANSITIONS_ALWAYS_ON,
	);
	const routeKeys = useBlankStackStore((store) => store.routeKeys);
	const dimensions = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const stackProgressEntries = useMemo(
		() =>
			routeKeys.map((routeKey) => ({
				routeKey,
				visualProgress: AnimationStore.getValue(routeKey, "visualProgress"),
			})),
		[routeKeys],
	);

	const currDescriptor = useDescriptorsStore(
		(store) => store.descriptors.current,
	);
	const nextDescriptor = useDescriptorsStore((store) => store.descriptors.next);
	const prevDescriptor = useDescriptorsStore(
		(store) => store.descriptors.previous,
	);
	const currentAnimation = useBuildTransitionState(currDescriptor);
	const nextAnimation = useBuildTransitionState(nextDescriptor);
	const prevAnimation = useBuildTransitionState(prevDescriptor);
	const currentRouteKey = currDescriptor.route.key;

	const nextRouteKey = nextDescriptor?.route?.key;
	const nextHasTransitions =
		!!nextRouteKey &&
		hasTransitionsEnabled(nextDescriptor?.options, transitionsAlwaysOn);

	const initialInterpolatorProps = useMemo(
		() =>
			createInitialInterpolatorProps({
				dimensions,
				insets,
				currentDescriptor: currDescriptor,
				nextDescriptor,
				prevDescriptor,
			}),
		[dimensions, insets, currDescriptor, nextDescriptor, prevDescriptor],
	);

	const selectedInterpolatorOptions =
		useSharedValue<SelectedInterpolatorOptions>({
			owner: "current",
		});
	const screenInterpolatorProps = useDerivedValue<ScreenInterpolatorFrame>(
		() => {
			"worklet";
			const interpolatorOptions = selectedInterpolatorOptions.get();
			return hydrateInterpolatorFrame({
				frame: { ...initialInterpolatorProps },
				dimensions,
				insets,
				currentAnimation,
				nextAnimation,
				prevAnimation,
				nextHasTransitions,
				interpolatorOptions,
				stackProgressEntries,
				currentRouteKey,
			});
		},
	);

	const nextInterpolator = nextDescriptor?.options.screenStyleInterpolator;
	const currentInterpolator = currDescriptor.options.screenStyleInterpolator;

	return {
		screenInterpolatorProps,
		selectedInterpolatorOptions,
		nextInterpolator,
		currentInterpolator,
	};
}
