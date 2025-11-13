import type { ParamListBase, RouteProp } from "@react-navigation/native";
import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { type SharedValue, useDerivedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
	DEFAULT_SCREEN_TRANSITION_STATE,
	NO_BOUNDS_MAP,
} from "../../constants";
import { type TransitionDescriptor, useKeys } from "../../providers/keys";
import { Animations } from "../../stores/animations";
import { Bounds } from "../../stores/bounds";
import { type GestureMap, Gestures } from "../../stores/gestures";
import type {
	ScreenInterpolationProps,
	ScreenTransitionState,
} from "../../types/animation";
import { derivations } from "../../utils/animation/derivations";
import { createBounds } from "../../utils/bounds";

type BuiltState = {
	progress: SharedValue<number>;
	closing: SharedValue<number>;
	animating: SharedValue<number>;
	gesture: GestureMap;
	route: RouteProp<ParamListBase>;
};

const unwrap = (
	s: BuiltState | undefined,
	key: string | undefined,
): ScreenTransitionState | undefined => {
	"worklet";
	if (!s || !key) return undefined;

	return {
		progress: s.progress.value,
		closing: s.closing.value,
		animating: s.animating.value,
		gesture: {
			x: s.gesture.x.value,
			y: s.gesture.y.value,
			normalizedX: s.gesture.normalizedX.value,
			normalizedY: s.gesture.normalizedY.value,
			isDismissing: s.gesture.isDismissing.value,
			isDragging: s.gesture.isDragging.value,
			direction: s.gesture.direction.value,
		},
		bounds: Bounds.getBounds(key) || NO_BOUNDS_MAP,
		route: s.route,
	};
};

const useBuildScreenTransitionState = (
	descriptor: TransitionDescriptor | undefined,
): BuiltState | undefined => {
	const key = descriptor?.route.key;

	return useMemo(() => {
		if (!key) return undefined;

		return {
			progress: Animations.getAnimation(key, "progress"),
			closing: Animations.getAnimation(key, "closing"),
			animating: Animations.getAnimation(key, "animating"),
			gesture: Gestures.getRouteGestures(key),
			route: descriptor.route,
		};
	}, [key, descriptor?.route]);
};

export function _useScreenAnimation() {
	const dimensions = useWindowDimensions();
	const insets = useSafeAreaInsets();

	const {
		current: currentDescriptor,
		next: nextDescriptor,
		previous: previousDescriptor,
	} = useKeys();

	const currentAnimation = useBuildScreenTransitionState(currentDescriptor);
	const nextAnimation = useBuildScreenTransitionState(nextDescriptor);
	const prevAnimation = useBuildScreenTransitionState(previousDescriptor);

	const screenInterpolatorProps = useDerivedValue<
		Omit<ScreenInterpolationProps, "bounds">
	>(() => {
		"worklet";

		const previous = unwrap(prevAnimation, previousDescriptor?.route.key);

		const next = nextDescriptor?.options?.enableTransitions
			? unwrap(nextAnimation, nextDescriptor?.route.key)
			: undefined;

		const current =
			unwrap(currentAnimation, currentDescriptor?.route.key) ??
			DEFAULT_SCREEN_TRANSITION_STATE;

		const {
			progress,
			focused,
			activeBoundId,
			active,
			isActiveTransitioning,
			isDismissing,
		} = derivations({
			current,
			next,
			previous,
		});

		return {
			layouts: { screen: dimensions },
			insets,
			previous,
			current,
			next,
			focused,
			activeBoundId,
			progress,

			active,
			isActiveTransitioning,
			isDismissing,
		};
	});

	const nextInterpolator = nextDescriptor?.options.screenStyleInterpolator;
	const currentInterpolator =
		currentDescriptor?.options.screenStyleInterpolator;

	const screenStyleInterpolator = nextInterpolator ?? currentInterpolator;

	return { screenInterpolatorProps, screenStyleInterpolator };
}

export function useScreenAnimation() {
	const { screenInterpolatorProps } = _useScreenAnimation();

	return useDerivedValue<ScreenInterpolationProps>(() => {
		const props = screenInterpolatorProps.value;
		return {
			...props,
			bounds: createBounds(props),
		};
	});
}
