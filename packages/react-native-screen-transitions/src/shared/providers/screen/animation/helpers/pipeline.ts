import { useMemo } from "react";
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
import type { BoundsAccessor } from "../../../../types/bounds.types";

import { createBoundsAccessor } from "../../../../utils/bounds";
import { useDescriptors } from "../../descriptors";
import { updateDerivations } from "./derivations";
import { hasTransitionsEnabled } from "./has-transitions-enabled";
import { hydrateTransitionState } from "./hydrate-transition-state";
import { useBuildTransitionState } from "./use-build-transition-state";

export type ScreenInterpolatorFrame = Omit<ScreenInterpolationProps, "bounds">;

interface ScreenAnimationPipeline {
	screenInterpolatorProps: SharedValue<ScreenInterpolatorFrame>;
	screenInterpolatorFrameUpdater: DerivedValue<number>;
	nextInterpolator: ScreenStyleInterpolator | undefined;
	currentInterpolator: ScreenStyleInterpolator | undefined;
	boundsAccessor: BoundsAccessor;
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

	const screenInterpolatorFrameRevisionState = useSharedValue({ value: 0 });
	const screenInterpolatorFrameUpdater = useDerivedValue<number>(() => {
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

		// MAINTAINER NOTE: We increment a revision counter instead of returning a
		// new frame object so consumers can subscribe to in-place frame updates.
		//
		// Since we mutate the frame in place for performance reasons, readers must
		// call `screenInterpolatorFrameUpdater.get()` before reading the frame.
		screenInterpolatorFrameRevisionState.modify((revision) => {
			"worklet";
			revision.value += 1;
			return revision;
		}, false);

		return screenInterpolatorFrameRevisionState.get().value;
	});

	const boundsAccessor = useMemo(() => {
		return createBoundsAccessor(() => {
			"worklet";
			return screenInterpolatorProps.get();
		});
	}, [screenInterpolatorProps]);

	const nextInterpolator = nextDescriptor?.options.screenStyleInterpolator;
	const currentInterpolator = currDescriptor?.options.screenStyleInterpolator;

	return {
		screenInterpolatorProps,
		screenInterpolatorFrameUpdater,
		nextInterpolator,
		currentInterpolator,
		boundsAccessor,
	};
}
