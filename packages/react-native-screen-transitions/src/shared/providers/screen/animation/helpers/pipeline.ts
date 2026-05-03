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
	screenInterpolatorVersion: DerivedValue<number>;
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

	const screenInterpolatorVersionState = useSharedValue({ value: 0 });

	const screenInterpolatorVersion = useDerivedValue<number>(() => {
		"worklet";

		const frame = screenInterpolatorProps.get();
		const versionState = screenInterpolatorVersionState.get();

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

		versionState.value += 1;
		return versionState.value;
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
		screenInterpolatorVersion,
		nextInterpolator,
		currentInterpolator,
		boundsAccessor,
	};
}
