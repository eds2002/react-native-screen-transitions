import type * as React from "react";
import { StyleSheet } from "react-native";
import Animated, {
	interpolate,
	useAnimatedProps,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { Screen as RNSScreen } from "react-native-screens";
import { AnimationStore } from "../../shared/stores/animation.store";

interface ScreenProps {
	routeKey: string;
	index: number;
	routesLength: number;
	isPreloaded: boolean;
	children: React.ReactNode;
	freezeOnBlur?: boolean;
	shouldFreeze?: boolean;
	activeScreensLimit: number;
}

const EPSILON = 1e-5;

const STATE_INACTIVE = 0;
const STATE_TRANSITIONING_OR_BELOW_TOP = 1;
const STATE_ON_TOP = 2;

const AnimatedScreen = Animated.createAnimatedComponent(RNSScreen);

export const Screen = ({
	routeKey,
	index,
	routesLength,
	isPreloaded,
	activeScreensLimit,
	children,
	freezeOnBlur,
	shouldFreeze,
}: ScreenProps) => {
	const sceneProgress = AnimationStore.getAnimation(routeKey, "progress");
	const sceneClosing = AnimationStore.getAnimation(routeKey, "closing");
	const screenActivity = useSharedValue<0 | 1 | 2>(1);

	useDerivedValue(() => {
		if (!sceneProgress) {
			screenActivity.set(STATE_TRANSITIONING_OR_BELOW_TOP);
			return;
		}

		if (index < routesLength - activeScreensLimit - 1 || isPreloaded) {
			screenActivity.set(STATE_INACTIVE);
		} else {
			const outputValue =
				index === routesLength - 1
					? STATE_ON_TOP
					: index >= routesLength - activeScreensLimit
						? STATE_TRANSITIONING_OR_BELOW_TOP
						: STATE_INACTIVE;

			const v = interpolate(
				sceneProgress.get(),
				[0, 1 - EPSILON, 1],
				[1, 1, outputValue],
				"clamp",
			);

			const next =
				(Math.trunc(v) as 0 | 1 | 2) ?? STATE_TRANSITIONING_OR_BELOW_TOP;

			if (next !== screenActivity.get()) {
				screenActivity.set(next);
			}
		}
	});

	const animatedProps = useAnimatedProps(() => {
		const activity = screenActivity.get();
		return {
			activityState: activity,
			shouldFreeze: activity === STATE_INACTIVE && shouldFreeze,
			pointerEvents: sceneClosing.get()
				? ("none" as const)
				: ("box-none" as const),
		};
	});

	return (
		<AnimatedScreen
			enabled
			style={StyleSheet.absoluteFill}
			freezeOnBlur={freezeOnBlur}
			animatedProps={animatedProps}
		>
			{children}
		</AnimatedScreen>
	);
};
