import type { ParamListBase, RouteProp } from "@react-navigation/native";
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
import { buildBoundsAccessor } from "../../utils/bounds";

type BuiltState = {
	progress: SharedValue<number>;
	closing: SharedValue<number>;
	animating: SharedValue<number>;
	gesture: GestureMap;
	route: RouteProp<ParamListBase>;
};

const FALLBACK = Object.freeze({
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

const useBuildScreenTransitionState = (
	descriptor: NativeStackDescriptor | undefined,
): BuiltState | undefined => {
	const key = descriptor?.route.key;
	if (!key) return undefined;
	const progress = Animations.getAnimation(key, "progress");
	const closing = Animations.getAnimation(key, "closing");
	const animating = Animations.getAnimation(key, "animating");
	const gesture = Gestures.getRouteGestures(key);
	const route = descriptor?.route;

	return { progress, closing, animating, gesture, route };
};

const unwrap = (
	s: BuiltState | undefined,
	key: string | undefined,
): ScreenTransitionState | undefined => {
	"worklet";
	return s && key
		? {
				progress: s.progress.value ?? 0,
				closing: s.closing.value ?? 0,
				animating: s.animating.value ?? 0,
				gesture: {
					x: s.gesture.x.value ?? 0,
					y: s.gesture.y.value ?? 0,
					normalizedX: s.gesture.normalizedX.value ?? 0,
					normalizedY: s.gesture.normalizedY.value ?? 0,
					isDismissing: s.gesture.isDismissing.value ?? 0,
					isDragging: s.gesture.isDragging.value ?? 0,
				},
				bounds: Bounds.getBounds(key) ?? {},
				route: s.route,
			}
		: undefined;
};

export function _useScreenAnimation() {
	const {
		current: currentDescriptor,
		next: nextDescriptor,
		previous: previousDescriptor,
	} = useKeys();

	const dimensions = useWindowDimensions();

	const currentAnimation = useBuildScreenTransitionState(currentDescriptor);

	const nextAnimation = useBuildScreenTransitionState(nextDescriptor);
	const prevAnimation = useBuildScreenTransitionState(previousDescriptor);

	const insets = useSafeAreaInsets();

	const screenInterpolatorProps = useDerivedValue<ScreenInterpolationProps>(
		() => {
			"worklet";

			const previous = unwrap(prevAnimation, previousDescriptor?.route.key);
			const next = unwrap(nextAnimation, nextDescriptor?.route.key);
			const current =
				unwrap(currentAnimation, currentDescriptor?.route.key) ?? FALLBACK;

			const progress = current.progress + (next?.progress ?? 0);

			const focused = !next;
			const activeBoundId = Bounds.getActiveBoundId() || "";

			const bounds = buildBoundsAccessor({
				activeBoundId,
				current,
				previous,
				next,
				progress,
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
			} satisfies ScreenInterpolationProps;
		},
	);

	const screenStyleInterpolator =
		nextDescriptor?.options.screenStyleInterpolator ||
		currentDescriptor?.options.screenStyleInterpolator;

	return { screenInterpolatorProps, screenStyleInterpolator };
}
export function useScreenAnimation() {
	const { screenInterpolatorProps } = _useScreenAnimation();

	return useDerivedValue(() => screenInterpolatorProps.value);
}
