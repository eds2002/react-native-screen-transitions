import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
	type DerivedValue,
	type SharedValue,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenTransitionConfig } from "../../../../../native-stack/types";
import {
	createScreenTransitionState,
	DEFAULT_SCREEN_TRANSITION_STATE,
} from "../../../../constants";
import { useStack } from "../../../../hooks/navigation/use-stack";
import { AnimationStore } from "../../../../stores/animation.store";
import {
	GestureStore,
	type GestureStoreMap,
} from "../../../../stores/gesture.store";
import type {
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
	ScreenTransitionState,
} from "../../../../types/animation.types";
import type { BoundsAccessor } from "../../../../types/bounds.types";
import type { ScreenTransitionConfig } from "../../../../types/screen.types";
import type { BaseStackRoute } from "../../../../types/stack.types";
import { createBoundsAccessor } from "../../../../utils/bounds";
import { type BaseDescriptor, useKeys } from "../../keys";
import { derivations } from "./derivations";
import { toPlainRoute, toPlainValue } from "./worklet";

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

export interface ScreenAnimationPipeline {
	screenInterpolatorProps: DerivedValue<
		Omit<ScreenInterpolationProps, "bounds">
	>;
	nextInterpolator: ScreenStyleInterpolator | undefined;
	currentInterpolator: ScreenStyleInterpolator | undefined;
	boundsAccessor: BoundsAccessor;
}

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
	out.gesture.normX = s.gesture.normX.value;
	out.gesture.normY = s.gesture.normY.value;
	out.gesture.dismissing = s.gesture.dismissing.value;
	out.gesture.dragging = s.gesture.dragging.value;
	out.gesture.direction = s.gesture.direction.value;

	// Deprecated aliases (kept for backwards compatibility)
	out.gesture.normalizedX = out.gesture.normX;
	out.gesture.normalizedY = out.gesture.normY;
	out.gesture.isDismissing = out.gesture.dismissing;
	out.gesture.isDragging = out.gesture.dragging;

	out.settled =
		out.gesture.dragging ||
		out.animating ||
		out.gesture.dismissing ||
		out.closing
			? 0
			: 1;
	out.meta = s.meta;

	return out;
};

const useBuildScreenTransitionState = (
	descriptor: BaseDescriptor | undefined,
): BuiltState | undefined => {
	const key = descriptor?.route?.key;
	const meta = descriptor?.options?.meta;
	const route = descriptor?.route;

	return useMemo(() => {
		if (!key || !route) return undefined;

		const plainRoute = toPlainRoute(route);
		const plainMeta = meta
			? (toPlainValue(meta) as Record<string, unknown>)
			: undefined;

		return {
			progress: AnimationStore.getAnimation(key, "progress"),
			closing: AnimationStore.getAnimation(key, "closing"),
			entering: AnimationStore.getAnimation(key, "entering"),
			animating: AnimationStore.getAnimation(key, "animating"),
			gesture: GestureStore.getRouteGestures(key),
			route: plainRoute,
			meta: plainMeta,
			unwrapped: createScreenTransitionState(plainRoute, plainMeta),
		};
	}, [key, meta, route]);
};

const hasTransitionsEnabled = (
	options: ScreenTransitionConfig | undefined,
	alwaysOn: boolean,
) => {
	if (alwaysOn) return true;
	return !!(options as NativeStackScreenTransitionConfig)?.enableTransitions;
};

export function useScreenAnimationPipeline(): ScreenAnimationPipeline {
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

	const nextRouteKey = nextDescriptor?.route?.key;
	const nextHasTransitions =
		!!nextRouteKey &&
		hasTransitionsEnabled(nextDescriptor?.options, transitionsAlwaysOn);

	const framePropsMutable = useSharedValue<
		Omit<ScreenInterpolationProps, "bounds">
	>({
		layouts: { screen: dimensions },
		insets,
		previous: undefined,
		current: DEFAULT_SCREEN_TRANSITION_STATE,
		next: undefined,
		progress: 0,
		stackProgress: 0,
		snapIndex: -1,
		focused: true,
		active: DEFAULT_SCREEN_TRANSITION_STATE,
		inactive: undefined,
		isActiveTransitioning: false,
		isDismissing: false,
	});

	const boundsAccessor = useMemo(() => {
		return createBoundsAccessor(() => {
			"worklet";
			return framePropsMutable.value;
		});
	}, [framePropsMutable]);

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

		const nextProps = {
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

		framePropsMutable.value = nextProps;
		return nextProps;
	});

	const nextInterpolator = nextDescriptor?.options.screenStyleInterpolator;
	const currentInterpolator =
		currentDescriptor?.options.screenStyleInterpolator;

	return {
		screenInterpolatorProps,
		nextInterpolator,
		currentInterpolator,
		boundsAccessor,
	};
}
