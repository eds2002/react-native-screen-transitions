import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
	type SharedValue,
	useAnimatedReaction,
	useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DEFAULT_SCREEN_TRANSITION_STATE } from "../../../../constants";
import { useStack } from "../../../../hooks/navigation/use-stack";
import type {
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
} from "../../../../types/animation.types";
import type { BoundsAccessor } from "../../../../types/bounds.types";

import { createBoundsAccessor } from "../../../../utils/bounds";
import { useDescriptors } from "../../descriptors";
import { derivations } from "./derivations";
import { hasTransitionsEnabled } from "./has-transitions-enabled";
import { hydrateTransitionState } from "./hydrate-transition-state";
import { useBuildTransitionState } from "./use-build-transition-state";

export type ScreenInterpolatorFrame = Omit<ScreenInterpolationProps, "bounds">;

interface ScreenAnimationPipeline {
	screenInterpolatorProps: SharedValue<ScreenInterpolatorFrame>;
	nextInterpolator: ScreenStyleInterpolator | undefined;
	currentInterpolator: ScreenStyleInterpolator | undefined;
	boundsAccessor: BoundsAccessor;
}

const createInitialBaseInterpolatorProps = (
	dimensions: ScreenInterpolatorFrame["layouts"]["screen"],
	insets: ScreenInterpolatorFrame["insets"],
): ScreenInterpolatorFrame => ({
	layouts: { screen: dimensions, navigationMaskEnabled: false },
	insets,
	previous: undefined,
	current: DEFAULT_SCREEN_TRANSITION_STATE,
	next: undefined,
	progress: 0,
	stackProgress: 0,
	snapIndex: -1,
	logicallySettled: 1,
	focused: true,
	active: DEFAULT_SCREEN_TRANSITION_STATE,
	inactive: undefined,
});

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

	const currentAnimation = useBuildTransitionState(currDescriptor, "current");
	const nextAnimation = useBuildTransitionState(nextDescriptor, "next");
	const prevAnimation = useBuildTransitionState(prevDescriptor, "previous");

	const currentRouteKey = currDescriptor?.route?.key;
	const currentIndex = routeKeys.indexOf(currentRouteKey);

	const nextRouteKey = nextDescriptor?.route?.key;
	const nextHasTransitions =
		!!nextRouteKey &&
		hasTransitionsEnabled(nextDescriptor?.options, transitionsAlwaysOn);

	const screenInterpolatorProps = useSharedValue<ScreenInterpolatorFrame>(
		createInitialBaseInterpolatorProps(dimensions, insets),
	);

	const boundsAccessor = useMemo(() => {
		return createBoundsAccessor(() => {
			"worklet";
			return screenInterpolatorProps.get();
		});
	}, [screenInterpolatorProps]);

	useAnimatedReaction(
		() => {
			"worklet";

			const previous = prevAnimation
				? hydrateTransitionState(prevAnimation, dimensions)
				: undefined;

			const next =
				nextAnimation && nextHasTransitions
					? hydrateTransitionState(nextAnimation, dimensions)
					: undefined;

			const current = currentAnimation
				? hydrateTransitionState(currentAnimation, dimensions)
				: DEFAULT_SCREEN_TRANSITION_STATE;

			const { progress, ...helpers } = derivations({
				previous,
				current,
				next,
			});

			const stackProgress =
				currentIndex >= 0 ? rootStackProgress.get() - currentIndex : progress;

			const focused = helpers.focused;
			const active = helpers.active;
			const inactive = helpers.inactive;
			const snapIndex = current.animatedSnapIndex ?? current.snapIndex;
			const logicallySettled = active.logicallySettled;

			return {
				previous,
				current,
				next,
				progress,
				stackProgress,
				snapIndex,
				logicallySettled,
				focused,
				active,
				inactive,
			};
		},
		({
			previous,
			current,
			next,
			progress,
			stackProgress,
			snapIndex,
			logicallySettled,
			focused,
			active,
			inactive,
		}) => {
			"worklet";

			screenInterpolatorProps.modify((frame) => {
				"worklet";
				frame.layouts = current.layouts;
				frame.insets = insets;
				frame.previous = previous;
				frame.current = current;
				frame.next = next;
				frame.progress = progress;
				frame.stackProgress = stackProgress;
				frame.snapIndex = snapIndex;
				frame.logicallySettled = logicallySettled;
				frame.focused = focused;
				frame.active = active;
				frame.inactive = inactive;
				return frame;
			});
		},
	);

	const nextInterpolator = nextDescriptor?.options.screenStyleInterpolator;
	const currentInterpolator = currDescriptor?.options.screenStyleInterpolator;

	return {
		screenInterpolatorProps,
		nextInterpolator,
		currentInterpolator,
		boundsAccessor,
	};
}
