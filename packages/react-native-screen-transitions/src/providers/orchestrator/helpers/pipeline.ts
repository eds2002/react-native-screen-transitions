import { useWindowDimensions } from "react-native";
import {
	type DerivedValue,
	type SharedValue,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEFAULT_SCREEN_TRANSITION_STATE } from "../../../constants";
import type {
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
} from "../../../types/animation.types";
import { useBuilderStore } from "../../builder";
import { hydrateTransitionState } from "../../motion/animation/helpers/hydrate-transition-state";
import type { BuiltState } from "../../motion/animation/helpers/hydrate-transition-state/types";
import {
	useMotionStore,
	useOptionalMotionStore,
} from "../../motion/motion.store";
import { updateDerivations } from "./derivations";
import type { SelectedInterpolatorOptions } from "./selected-interpolator-options";
import { readStackProgress, type StackProgressEntry } from "./stack-progress";
import { useInterpolatorState } from "./use-interpolator-state";
import { useStackProgressInputs } from "./use-stack-progress-inputs";

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

const hydrateInterpolatorFrame = ({
	dimensions,
	insets,
	currentAnimation,
	nextAnimation: activeNextAnimation,
	closingNextAnimation,
	prevAnimation,
	interpolatorOptions,
	stackProgressEntries,
	currentRouteKey,
}: {
	dimensions: ScreenInterpolatorFrame["layouts"]["screen"];
	insets: ScreenInterpolatorFrame["insets"];
	currentAnimation: BuiltState | undefined;
	nextAnimation: BuiltState | undefined;
	closingNextAnimation: BuiltState | undefined;
	prevAnimation: BuiltState | undefined;
	interpolatorOptions: SelectedInterpolatorOptions;
	stackProgressEntries: readonly StackProgressEntry[];
	currentRouteKey: string;
}): ScreenInterpolatorFrame => {
	"worklet";
	// With a screen still closing between this one and its next (a push landed during a close), follow
	// whichever covers this screen more. The closing one's progress falls while the new one's rises, so
	// the hand-over happens where they're equal instead of jumping to the new screen's progress.
	// (transitionProgress: the animations update it before any screen's styles are computed.)
	const nextAnimation =
		closingNextAnimation &&
		(!activeNextAnimation ||
			closingNextAnimation.transitionProgress.get() >
				activeNextAnimation.transitionProgress.get())
			? closingNextAnimation
			: activeNextAnimation;
	const shouldApplyOptionsToCurrent = interpolatorOptions.owner === "current";
	const shouldApplyOptionsToNext =
		interpolatorOptions.owner === "next" && !!nextAnimation;

	const current = currentAnimation
		? hydrateTransitionState(
				currentAnimation,
				dimensions,
				shouldApplyOptionsToCurrent ? interpolatorOptions.options : undefined,
			)
		: DEFAULT_SCREEN_TRANSITION_STATE;
	const frame: ScreenInterpolatorFrame = {
		layouts: current.layouts,
		insets,
		previous: prevAnimation
			? hydrateTransitionState(prevAnimation, dimensions)
			: undefined,
		current,
		next: nextAnimation
			? hydrateTransitionState(
					nextAnimation,
					dimensions,
					shouldApplyOptionsToNext ? interpolatorOptions.options : undefined,
				)
			: undefined,
		progress: 0,
		transitionProgress: 0,
		stackProgress: 0,
		focused: true,
		active: current,
		inactive: undefined,
	};

	updateDerivations(frame);

	frame.stackProgress = readStackProgress(
		stackProgressEntries,
		currentRouteKey,
		frame.progress,
	);

	return frame;
};

export function useScreenAnimationPipeline(): ScreenAnimationPipeline {
	const currentRouteKey = useBuilderStore(
		(store) => store.descriptors.current.route.key,
	);
	const dimensions = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const { entries: liveStackProgressEntries, revision: stackProgressRevision } =
		useStackProgressInputs(currentRouteKey);

	const currDescriptor = useBuilderStore((store) => store.descriptors.current);
	const nextDescriptor = useBuilderStore((store) => store.descriptors.next);
	const closingNextDescriptor = useBuilderStore(
		(store) => store.descriptors.closingNext,
	);
	const prevDescriptor = useBuilderStore((store) => store.descriptors.previous);
	const currentMotion = useMotionStore((store) => store.state);
	const nextMotion = useOptionalMotionStore(
		nextDescriptor?.route.key ?? null,
		(store) => store.state,
	);
	const closingNextMotion = useOptionalMotionStore(
		closingNextDescriptor?.route.key ?? null,
		(store) => store.state,
	);
	const previousMotion = useOptionalMotionStore(
		prevDescriptor?.route.key ?? null,
		(store) => store.state,
	);
	const currentAnimation = useInterpolatorState(currentMotion);
	const nextAnimation = useInterpolatorState(nextMotion);
	const closingNextAnimation = useInterpolatorState(closingNextMotion);
	const prevAnimation = useInterpolatorState(previousMotion);

	const selectedInterpolatorOptions =
		useSharedValue<SelectedInterpolatorOptions>({
			owner: "current",
		});
	const screenInterpolatorProps = useDerivedValue<ScreenInterpolatorFrame>(
		() => {
			"worklet";
			stackProgressRevision.get();
			const interpolatorOptions = selectedInterpolatorOptions.get();
			return hydrateInterpolatorFrame({
				dimensions,
				insets,
				currentAnimation,
				nextAnimation,
				closingNextAnimation,
				prevAnimation,
				interpolatorOptions,
				stackProgressEntries: liveStackProgressEntries.get(),
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
