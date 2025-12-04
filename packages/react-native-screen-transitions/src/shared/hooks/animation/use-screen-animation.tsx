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
import type { GestureDirection } from "../../types/gesture.types";
import { derivations } from "../../utils/animation/derivations";
import { createBounds } from "../../utils/bounds";

type BuiltState = {
	progress: SharedValue<number>;
	closing: SharedValue<number>;
	animating: SharedValue<number>;
	gesture: GestureStoreMap;
	route: RouteProp<ParamListBase>;
	unwrapped: ScreenTransitionState;
};

const createScreenTransitionState = (
	route: RouteProp<ParamListBase>,
): ScreenTransitionState => ({
	progress: 0,
	closing: 0,
	animating: 0,
	gesture: {
		x: 0,
		y: 0,
		normalizedX: 0,
		normalizedY: 0,
		isDismissing: 0,
		isDragging: 0,
		direction: null,
	},
	route,
});

const unwrapInto = (s: BuiltState): ScreenTransitionState => {
	"worklet";
	const out = s.unwrapped;
	out.progress = s.progress.value;
	out.closing = s.closing.value;
	out.animating = s.animating.value;
	out.gesture.x = s.gesture.x.value;
	out.gesture.y = s.gesture.y.value;
	out.gesture.normalizedX = s.gesture.normalizedX.value;
	out.gesture.normalizedY = s.gesture.normalizedY.value;
	out.gesture.isDismissing = s.gesture.isDismissing.value;
	out.gesture.isDragging = s.gesture.isDragging.value;
	out.gesture.direction = s.gesture.direction.value as Omit<
		GestureDirection,
		"bidirectional"
	> | null;

	return out;
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
			unwrapped: createScreenTransitionState(descriptor.route),
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

		const previous = prevAnimation ? unwrapInto(prevAnimation) : undefined;

		const next =
			nextAnimation && hasTransitionsEnabled(nextDescriptor?.options)
				? unwrapInto(nextAnimation)
				: undefined;

		const current = currentAnimation
			? unwrapInto(currentAnimation)
			: DEFAULT_SCREEN_TRANSITION_STATE;

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
