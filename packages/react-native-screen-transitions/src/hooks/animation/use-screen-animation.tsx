import type { ParamListBase, RouteProp } from "@react-navigation/native";
import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import { type SharedValue, useDerivedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeys } from "../../providers/keys";
import { Animations } from "../../stores/animations";
import { Bounds } from "../../stores/bounds";
import { type GestureMap, Gestures } from "../../stores/gestures";
import type {
	ScreenInterpolationProps,
	ScreenTransitionState,
} from "../../types/animation";
import type { BoundEntry } from "../../types/bounds";
import type { NativeStackDescriptor } from "../../types/navigator";
import { derivations } from "../../utils/animation/derivations";

type BuiltState = {
	progress: SharedValue<number>;
	closing: SharedValue<number>;
	animating: SharedValue<number>;
	gesture: GestureMap;
	route: RouteProp<ParamListBase>;
};

const EMPTY_BOUNDS = Object.freeze({}) as Record<string, BoundEntry>;

const FALLBACK: ScreenTransitionState = Object.freeze({
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
	},
	bounds: {} as Record<string, BoundEntry>,
	route: {} as RouteProp<ParamListBase>,
});

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
		},
		bounds: Bounds.getBounds(key) || EMPTY_BOUNDS,
		route: s.route,
	};
};

const useBuildScreenTransitionState = (
	descriptor: NativeStackDescriptor | undefined,
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

	const screenInterpolatorProps = useDerivedValue<ScreenInterpolationProps>(
		(): ScreenInterpolationProps => {
			"worklet";

			const previous = unwrap(prevAnimation, previousDescriptor?.route.key);
			const next = unwrap(nextAnimation, nextDescriptor?.route.key);
			const current =
				unwrap(currentAnimation, currentDescriptor?.route.key) ?? FALLBACK;

			const { progress, focused, activeBoundId, bounds } = derivations({
				current,
				next,
				previous,
				dimensions,
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
				bounds,
			};
		},
	);

	// Prefer the next descriptor's interpolator only when transitions are enabled on it.
	// If the next screen doesn't opt-in to transitions, avoid falling back to the current
	// screen's interpolator to prevent unintended global styles (e.g., scaling previous screens
	// when presenting non-transitioning modals/sheets).
	const nextEnabled = nextDescriptor?.options.enableTransitions === true;
	const currentEnabled = currentDescriptor?.options.enableTransitions === true;

	const screenStyleInterpolator = nextEnabled
		? nextDescriptor?.options.screenStyleInterpolator
		: nextDescriptor
			? undefined
			: currentEnabled
				? currentDescriptor?.options.screenStyleInterpolator
				: undefined;

	return { screenInterpolatorProps, screenStyleInterpolator };
}

export function useScreenAnimation() {
	const { screenInterpolatorProps } = _useScreenAnimation();

	return useDerivedValue(() => screenInterpolatorProps.value);
}
