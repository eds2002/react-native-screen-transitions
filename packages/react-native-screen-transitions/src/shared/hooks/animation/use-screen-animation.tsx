import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { type SharedValue, useDerivedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenTransitionConfig } from "../../../native-stack/types";
import {
	createScreenTransitionState,
	DEFAULT_SCREEN_TRANSITION_STATE,
} from "../../constants";
import {
	type BaseDescriptor,
	useKeys,
} from "../../providers/screen/keys.provider";
import { AnimationStore } from "../../stores/animation.store";
import { GestureStore, type GestureStoreMap } from "../../stores/gesture.store";
import type {
	ScreenInterpolationProps,
	ScreenTransitionState,
} from "../../types/animation.types";
import type { ScreenTransitionConfig } from "../../types/screen.types";
import type { BaseStackRoute } from "../../types/stack.types";
import { derivations } from "../../utils/animation/derivations";
import {
	assertWorkletSerializable,
	toPlainRoute,
} from "../../utils/animation/worklet";
import { createBounds } from "../../utils/bounds";
import { useStack } from "../navigation/use-stack";

type BuiltState = {
	progress: SharedValue<number>;
	closing: SharedValue<number>;
	animating: SharedValue<number>;
	entering: SharedValue<number>;
	gesture: GestureStoreMap;
	route: BaseStackRoute;
	meta?: Record<string, unknown>;
	unwrapped: ScreenTransitionState;
};

/**
 * Computes the animated snap index based on progress and snap points.
 * Returns -1 if no snap points, otherwise interpolates between indices.
 */
const computeSnapIndex = (progress: number, snapPoints: number[]): number => {
	"worklet";
	if (snapPoints.length === 0) return -1;
	if (progress <= snapPoints[0]) return 0;
	if (progress >= snapPoints[snapPoints.length - 1])
		return snapPoints.length - 1;

	for (let i = 0; i < snapPoints.length - 1; i++) {
		if (progress <= snapPoints[i + 1]) {
			const t =
				(progress - snapPoints[i]) / (snapPoints[i + 1] - snapPoints[i]);
			return i + t;
		}
	}
	return snapPoints.length - 1;
};

const unwrapInto = (s: BuiltState): ScreenTransitionState => {
	"worklet";
	const out = s.unwrapped;
	out.progress = s.progress.value;
	out.closing = s.closing.value;
	out.entering = s.entering.value;
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
	const key = descriptor?.route?.key;
	const meta = descriptor?.options?.meta;

	return useMemo(() => {
		if (!key || !descriptor?.route) return undefined;

		// DEV-only: ensure meta and params are worklet-serializable
		if (__DEV__) {
			if (meta !== undefined) {
				assertWorkletSerializable(meta, "options.meta");
			}
			if (descriptor.route.params !== undefined) {
				assertWorkletSerializable(descriptor.route.params, "route.params");
			}
		}

		const plainRoute = toPlainRoute(descriptor.route);

		return {
			progress: AnimationStore.getAnimation(key, "progress"),
			closing: AnimationStore.getAnimation(key, "closing"),
			entering: AnimationStore.getAnimation(key, "entering"),
			animating: AnimationStore.getAnimation(key, "animating"),
			gesture: GestureStore.getRouteGestures(key),
			route: plainRoute,
			meta,
			unwrapped: createScreenTransitionState(plainRoute, meta),
		};
	}, [key, meta, descriptor]);
};

const hasTransitionsEnabled = (
	options: ScreenTransitionConfig | undefined,
	alwaysOn: boolean,
) => {
	if (alwaysOn) return true;
	return !!(options as NativeStackScreenTransitionConfig)?.enableTransitions;
};

export function _useScreenAnimation() {
	const insets = useSafeAreaInsets();
	const dimensions = useWindowDimensions();

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

	const sortedSnapPoints = useMemo(() => {
		const points = currentDescriptor?.options?.snapPoints;
		return points ? [...points].sort((a, b) => a - b) : [];
	}, [currentDescriptor?.options?.snapPoints]);

	const nextHasTransitions = useMemo(() => {
		return nextDescriptor
			? hasTransitionsEnabled(nextDescriptor.options, transitionsAlwaysOn)
			: false;
	}, [nextDescriptor, transitionsAlwaysOn]);

	const screenInterpolatorProps = useDerivedValue<
		Omit<ScreenInterpolationProps, "bounds">
	>(() => {
		"worklet";

		const previous = prevAnimation ? unwrapInto(prevAnimation) : undefined;

		const next =
			nextAnimation && nextHasTransitions
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

		const snapIndex = computeSnapIndex(current.progress, sortedSnapPoints);

		return {
			layouts: { screen: dimensions },
			insets,
			previous,
			current,
			next,
			progress,
			stackProgress,
			snapIndex,
			...helpers,
		};
	});

	const nextInterpolator = nextDescriptor?.options.screenStyleInterpolator;
	const currentInterpolator =
		currentDescriptor?.options.screenStyleInterpolator;

	return {
		screenInterpolatorProps,
		nextInterpolator,
		currentInterpolator,
	};
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
