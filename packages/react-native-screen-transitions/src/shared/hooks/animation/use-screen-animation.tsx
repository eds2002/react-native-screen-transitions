import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { type SharedValue, useDerivedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenTransitionConfig } from "../../../native-stack/types";
import { DEFAULT_SCREEN_TRANSITION_STATE } from "../../constants";
import {
	type BaseDescriptor,
	type BaseRoute,
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
import { useStack } from "../use-stack";

type BuiltState = {
	progress: SharedValue<number>;
	closing: SharedValue<number>;
	animating: SharedValue<number>;
	gesture: GestureStoreMap;
	route: BaseRoute;
	meta?: Record<string, unknown>;
	unwrapped: ScreenTransitionState;
};

const createScreenTransitionState = (
	route: BaseRoute,
	meta?: Record<string, unknown>,
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
	meta,
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
	out.gesture.direction = s.gesture.direction.value;
	out.meta = s.meta;

	return out;
};

const useBuildScreenTransitionState = (
	descriptor: BaseDescriptor | undefined,
): BuiltState | undefined => {
	const key = descriptor?.route.key;
	const meta = descriptor?.options?.meta;

	return useMemo(() => {
		if (!key) return undefined;

		return {
			progress: AnimationStore.getAnimation(key, "progress"),
			closing: AnimationStore.getAnimation(key, "closing"),
			animating: AnimationStore.getAnimation(key, "animating"),
			gesture: GestureStore.getRouteGestures(key),
			route: descriptor.route,
			meta,
			unwrapped: createScreenTransitionState(descriptor.route, meta),
		};
	}, [key, descriptor?.route, meta]);
};

const hasTransitionsEnabled = (
	options: ScreenTransitionConfig | undefined,
	alwaysOn: boolean,
) => {
	"worklet";
	if (alwaysOn) return true;
	return !!(options as NativeStackScreenTransitionConfig)?.enableTransitions;
};

export function _useScreenAnimation() {
	const windowDimensions = useWindowDimensions();
	const dimensions = windowDimensions;

	const insets = useSafeAreaInsets();
	const { flags, stackProgress: rootStackProgress, routeKeys } = useStack();
	const transitionsAlwaysOn = flags.TRANSITIONS_ALWAYS_ON;

	const {
		current: currentDescriptor,
		next: nextDescriptor,
		previous: previousDescriptor,
	} = useKeys();

	const currentAnimation = useBuildScreenTransitionState(currentDescriptor);
	const nextAnimation = useBuildScreenTransitionState(nextDescriptor);
	const prevAnimation = useBuildScreenTransitionState(previousDescriptor);

	const currentRouteKey = currentDescriptor?.route?.key;
	const currentIndex = routeKeys.indexOf(currentRouteKey);

	const screenInterpolatorProps = useDerivedValue<
		Omit<ScreenInterpolationProps, "bounds">
	>(() => {
		"worklet";

		const previous = prevAnimation ? unwrapInto(prevAnimation) : undefined;

		const next =
			nextAnimation &&
			hasTransitionsEnabled(nextDescriptor?.options, transitionsAlwaysOn)
				? unwrapInto(nextAnimation)
				: undefined;

		const current = currentAnimation
			? unwrapInto(currentAnimation)
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

		return {
			layouts: { screen: dimensions },
			insets,
			previous,
			current,
			next,
			progress,
			stackProgress,
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
