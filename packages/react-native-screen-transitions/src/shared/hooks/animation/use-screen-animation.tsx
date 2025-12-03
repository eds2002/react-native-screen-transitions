import type { ParamListBase, RouteProp } from "@react-navigation/native";
import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { type SharedValue, useDerivedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenTransitionConfig } from "../../../native-stack/types";
import { DEFAULT_SCREEN_TRANSITION_STATE } from "../../constants";
import {
	type TransitionDescriptor,
	useKeys,
} from "../../providers/keys.provider";
import { AnimationStore } from "../../stores/animation.store";
import { GestureStore, type GestureStoreMap } from "../../stores/gesture.store";
import type {
	ScreenInterpolationProps,
	ScreenTransitionState,
} from "../../types/animation.types";
import type { ScreenTransitionConfig } from "../../types/core.types";
import { derivations } from "../../utils/animation/derivations";
import { createBounds } from "../../utils/bounds";

type BuiltState = {
	progress: SharedValue<number>;
	closing: SharedValue<number>;
	animating: SharedValue<number>;
	gesture: GestureStoreMap;
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
			progress: AnimationStore.getAnimation(key, "progress"),
			closing: AnimationStore.getAnimation(key, "closing"),
			animating: AnimationStore.getAnimation(key, "animating"),
			gesture: GestureStore.getRouteGestures(key),
			route: descriptor.route,
		};
	}, [key, descriptor?.route]);
};

const hasTransitionsEnabled = (options?: ScreenTransitionConfig) => {
	"worklet";
	return !!(options as NativeStackScreenTransitionConfig)?.enableTransitions;
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

		const next = hasTransitionsEnabled(nextDescriptor?.options)
			? unwrap(nextAnimation, nextDescriptor?.route.key)
			: undefined;

		const current =
			unwrap(currentAnimation, currentDescriptor?.route.key) ??
			DEFAULT_SCREEN_TRANSITION_STATE;

		const helpers = derivations({
			current,
			next,
		});

		return {
			layouts: { screen: dimensions },
			insets,
			previous,
			current,
			next,
			...helpers,
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
