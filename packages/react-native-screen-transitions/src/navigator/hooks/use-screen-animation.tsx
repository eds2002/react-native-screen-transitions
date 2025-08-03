import { useWindowDimensions } from "react-native";
import {
	interpolate,
	type MeasuredDimensions,
	type SharedValue,
	type StyleProps,
	useDerivedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ScreenInterpolationProps } from "../../types/animation";
import { useKeys } from "../context/keys";
import { Animations } from "../stores/animations";
import { Bounds } from "../stores/bounds";
import { type GestureMap, Gestures } from "../stores/gestures";

type BuiltState = {
	progress: SharedValue<number>;
	closing: SharedValue<number>;
	animating: SharedValue<number>;
	gesture: GestureMap;
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
	bounds: {} as Record<string, MeasuredDimensions>,
});

const EMPTY_STYLE: StyleProps = Object.freeze({});

const useBuildScreenTransitionState = (
	key: string | undefined,
): BuiltState | undefined => {
	if (!key) return undefined;
	const progress = Animations.getAnimation(key, "progress");
	const closing = Animations.getAnimation(key, "closing");
	const animating = Animations.getAnimation(key, "animating");
	const gesture = Gestures.getRouteGestures(key);

	return { progress, closing, animating, gesture };
};

const unwrap = (s: BuiltState | undefined, key: string | undefined) => {
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

	const currentAnimation = useBuildScreenTransitionState(
		currentDescriptor?.route.key,
	);

	const nextAnimation = useBuildScreenTransitionState(
		nextDescriptor?.route.key,
	);
	const prevAnimation = useBuildScreenTransitionState(
		previousDescriptor?.route.key,
	);

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
			const activeBoundId = Bounds.getActiveBoundId();

			const createBoundsBuilder = (id?: string) => {
				"worklet";

				const boundId = id || activeBoundId;

				let startScreen: "previous" | "current" | "next" | null = null;
				let endScreen: "previous" | "current" | "next" | null = null;
				let gestureX = 0;
				let gestureY = 0;
				let startOpacity = 0;
				let endOpacity = 0;
				let isReverse = false;

				const builder = {
					start: (screen: "previous" | "current" | "next") => {
						"worklet";
						startScreen = screen;
						return builder;
					},
					end: (screen: "previous" | "current" | "next") => {
						"worklet";
						endScreen = screen;
						return builder;
					},
					isEntering: () => {
						"worklet";
						isReverse = false;
						return builder;
					},
					isExiting: () => {
						"worklet";
						isReverse = true;
						return builder;
					},
					x: (value: number) => {
						"worklet";
						gestureX = value;
						return builder;
					},
					y: (value: number) => {
						"worklet";
						gestureY = value;
						return builder;
					},
					opacity: ([start, end]: [number, number]) => {
						"worklet";
						startOpacity = start;
						endOpacity = end;
						return builder;
					},
					build: () => {
						"worklet";
						if (!startScreen || !endScreen || !boundId) return EMPTY_STYLE;

						const start =
							startScreen === "previous"
								? previous?.bounds?.[boundId]
								: startScreen === "current"
									? current.bounds[boundId]
									: next?.bounds?.[boundId];

						const end =
							endScreen === "previous"
								? previous?.bounds[boundId]
								: endScreen === "current"
									? current.bounds[boundId]
									: next?.bounds[boundId];

						if (!start || !end) return EMPTY_STYLE;

						const dx = start.pageX - end.pageX + (start.width - end.width) / 2;
						const dy =
							start.pageY - end.pageY + (start.height - end.height) / 2;
						const scaleX = start.width / end.width;
						const scaleY = start.height / end.height;

						if (isReverse) {
							return {
								transform: [
									{ translateX: gestureX },
									{ translateY: gestureY },
									{ translateX: interpolate(progress, [1, 2], [0, -dx]) },
									{ translateY: interpolate(progress, [1, 2], [0, -dy]) },
									{ scaleX: interpolate(progress, [1, 2], [1, 1 / scaleX]) },
									{ scaleY: interpolate(progress, [1, 2], [1, 1 / scaleY]) },
								],
								opacity: interpolate(
									progress,
									[1, 2],
									[startOpacity, endOpacity],
								),
							} satisfies StyleProps;
						} else {
							return {
								transform: [
									{ translateX: gestureX },
									{ translateY: gestureY },
									{ translateX: interpolate(progress, [0, 1], [dx, 0]) },
									{ translateY: interpolate(progress, [0, 1], [dy, 0]) },
									{ scaleX: interpolate(progress, [0, 1], [scaleX, 1]) },
									{ scaleY: interpolate(progress, [0, 1], [scaleY, 1]) },
								],
								opacity: interpolate(
									progress,
									[0, 1],
									[startOpacity, endOpacity],
								),
							} satisfies StyleProps;
						}
					},
				};

				return builder;
			};

			return {
				layouts: { screen: dimensions },
				insets,
				previous,
				current,
				next,
				focused,
				activeBoundId,
				progress,
				bounds: (id?: string) => createBoundsBuilder(id),
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
