import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
	type DerivedValue,
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
import type {
	BoundsAccessor,
	BoundsInterpolationProps,
} from "../../../../types/bounds.types";

import { createBoundsAccessor } from "../../../../utils/bounds";
import { resolveNavigationMaskEnabled } from "../../../../utils/resolve-screen-transition-options";
import { useDescriptors } from "../../descriptors";
import { derivations } from "./derivations";
import { hasTransitionsEnabled } from "./has-transitions-enabled";
import { hydrateTransitionState } from "./hydrate-transition-state";
import { useBuildTransitionState } from "./use-build-transition-state";

type BaseInterpolatorProps = Omit<ScreenInterpolationProps, "bounds">;

interface ScreenAnimationPipeline {
	screenInterpolatorProps: DerivedValue<BaseInterpolatorProps>;
	nextInterpolator: ScreenStyleInterpolator | undefined;
	currentInterpolator: ScreenStyleInterpolator | undefined;
	boundsAccessor: BoundsAccessor;
}

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

	const currentNavigationMaskEnabled = resolveNavigationMaskEnabled(
		currDescriptor?.options ?? {},
	);

	const boundsFrameProps = useSharedValue<BoundsInterpolationProps>({
		layouts: { screen: dimensions },
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
		navigationMaskEnabled: currentNavigationMaskEnabled,
		inactive: undefined,
	});

	const boundsAccessor = useMemo(() => {
		return createBoundsAccessor(() => {
			"worklet";
			return boundsFrameProps.value;
		});
	}, [boundsFrameProps]);

	const screenInterpolatorProps = useDerivedValue<BaseInterpolatorProps>(() => {
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

		// Compute relative stack progress: total - currentIndex
		// This gives us the sum of progress values from current screen onwards
		// Falls back to current progress if index is invalid
		const stackProgress =
			currentIndex >= 0 ? rootStackProgress.value - currentIndex : progress;

		const nextProps: BaseInterpolatorProps = {
			layouts: current.layouts,
			insets,
			previous,
			current,
			next,
			progress,
			stackProgress,
			snapIndex: current.snapIndex,
			logicallySettled: helpers.active.logicallySettled,
			...helpers,
		};

		boundsFrameProps.value = {
			...nextProps,
			navigationMaskEnabled: currentNavigationMaskEnabled,
		};

		return nextProps;
	});

	const nextInterpolator = nextDescriptor?.options.screenStyleInterpolator;
	const currentInterpolator = currDescriptor?.options.screenStyleInterpolator;

	return {
		screenInterpolatorProps,
		nextInterpolator,
		currentInterpolator,
		boundsAccessor,
	};
}
