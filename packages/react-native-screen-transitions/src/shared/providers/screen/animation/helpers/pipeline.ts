import { useWindowDimensions } from "react-native";
import {
	type DerivedValue,
	type SharedValue,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEFAULT_SCREEN_TRANSITION_STATE } from "../../../../constants";
import { useStack } from "../../../../hooks/navigation/use-stack";
import type {
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
} from "../../../../types/animation.types";

import { useDescriptors } from "../../descriptors";
import { updateDerivations } from "./derivations";
import { hasTransitionsEnabled } from "./has-transitions-enabled";
import { hydrateTransitionState } from "./hydrate-transition-state";
import { useBuildTransitionState } from "./use-build-transition-state";

export type ScreenInterpolatorFrame = Omit<
	ScreenInterpolationProps,
	"bounds" | "transition"
>;

interface ScreenAnimationPipeline {
	screenInterpolatorProps: SharedValue<ScreenInterpolatorFrame>;
	screenInterpolatorPropsRevision: DerivedValue<number>;
	nextInterpolator: ScreenStyleInterpolator | undefined;
	currentInterpolator: ScreenStyleInterpolator | undefined;
}

const createInitialBaseInterpolatorProps = (
	dimensions: ScreenInterpolatorFrame["layouts"]["screen"],
	insets: ScreenInterpolatorFrame["insets"],
): ScreenInterpolatorFrame => {
	const current = {
		...DEFAULT_SCREEN_TRANSITION_STATE,
		layouts: { screen: dimensions, navigationMaskEnabled: false },
	};

	return {
		layouts: current.layouts,
		insets,
		previous: undefined,
		current,
		next: undefined,
		progress: 0,
		stackProgress: 0,
		logicallySettled: 1,
		focused: true,
		active: current,
		inactive: undefined,
	};
};

export function useScreenAnimationPipeline(): ScreenAnimationPipeline {
	const { flags, stackProgress: rootStackProgress, routeKeys } = useStack();
	const dimensions = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const transitionsAlwaysOn = flags.TRANSITIONS_ALWAYS_ON;

	const {
		current: currDescriptor,
		next: nextDescriptor,
		previous: prevDescriptor,
	} = useDescriptors();

	const currentAnimation = useBuildTransitionState(currDescriptor);
	const nextAnimation = useBuildTransitionState(nextDescriptor);
	const prevAnimation = useBuildTransitionState(prevDescriptor);

	const currentRouteKey = currDescriptor?.route?.key;
	const currentIndex = routeKeys.indexOf(currentRouteKey);

	const nextRouteKey = nextDescriptor?.route?.key;
	const nextHasTransitions =
		!!nextRouteKey &&
		hasTransitionsEnabled(nextDescriptor?.options, transitionsAlwaysOn);

	const screenInterpolatorProps = useSharedValue(
		createInitialBaseInterpolatorProps(dimensions, insets),
	);

	const propsRevisionState = useSharedValue({ value: 0 });
	const screenInterpolatorPropsRevision = useDerivedValue<number>(() => {
		"worklet";

		screenInterpolatorProps.modify((frame) => {
			"worklet";
			frame.previous = prevAnimation
				? hydrateTransitionState(prevAnimation, dimensions)
				: undefined;

			frame.current = currentAnimation
				? hydrateTransitionState(currentAnimation, dimensions)
				: DEFAULT_SCREEN_TRANSITION_STATE;

			frame.next =
				nextAnimation && nextHasTransitions
					? hydrateTransitionState(nextAnimation, dimensions)
					: undefined;

			frame.layouts = frame.current.layouts;
			frame.insets = insets;

			updateDerivations(frame);

			frame.stackProgress =
				currentIndex >= 0
					? rootStackProgress.get() - currentIndex
					: frame.progress;
			frame.logicallySettled = frame.active.logicallySettled;

			return frame;
		}, false);

		// Critical reactive dependency for `screenInterpolatorProps`.
		//
		// `screenInterpolatorProps` is mutated in place to avoid allocating a large
		// interpolator frame every tick. Consumers must read this revision before
		// reading `screenInterpolatorProps`, otherwise Reanimated may not subscribe
		// to frame updates and can observe stale transition state.
		propsRevisionState.modify((revision) => {
			"worklet";
			revision.value += 1;
			return revision;
		}, false);

		return propsRevisionState.get().value;
	});

	const nextInterpolator = nextDescriptor?.options.screenStyleInterpolator;
	const currentInterpolator = currDescriptor?.options.screenStyleInterpolator;

	return {
		screenInterpolatorProps,
		screenInterpolatorPropsRevision,
		nextInterpolator,
		currentInterpolator,
	};
}
