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
import { useComponentNavigationContext } from "../utils/with-component-navigation";

interface ScreenProps {
	routeKey: string;
	index: number;
	children: React.ReactNode;
	freezeOnBlur?: boolean;
	shouldFreeze?: boolean;
}

enum ScreenActivity {
	INACTIVE = 0,
	TRANSITIONING_OR_BELOW_TOP = 1,
	ON_TOP = 2,
}

const EPSILON = 1e-5;

const AnimatedScreen = Animated.createAnimatedComponent(RNSScreen);

export const Screen = ({
	routeKey,
	index,
	children,
	freezeOnBlur,
	shouldFreeze,
}: ScreenProps) => {
	const { activeScreensLimit, routes } = useComponentNavigationContext();
	const routesLength = routes.length;

	const sceneProgress = AnimationStore.getAnimation(routeKey, "progress");
	const sceneClosing = AnimationStore.getAnimation(routeKey, "closing");
	const screenActivity = useSharedValue<ScreenActivity>(
		ScreenActivity.TRANSITIONING_OR_BELOW_TOP,
	);

	useDerivedValue(() => {
		if (!sceneProgress) {
			screenActivity.set(ScreenActivity.TRANSITIONING_OR_BELOW_TOP);
			return;
		}

		if (index < routesLength - activeScreensLimit - 1) {
			screenActivity.set(ScreenActivity.INACTIVE);
		} else {
			const outputValue =
				index === routesLength - 1
					? ScreenActivity.ON_TOP
					: index >= routesLength - activeScreensLimit
						? ScreenActivity.TRANSITIONING_OR_BELOW_TOP
						: ScreenActivity.INACTIVE;

			const v = interpolate(
				sceneProgress.get(),
				[0, 1 - EPSILON, 1],
				[1, 1, outputValue],
				"clamp",
			);

			const next = Math.trunc(v) ?? ScreenActivity.TRANSITIONING_OR_BELOW_TOP;

			if (next !== screenActivity.get()) {
				screenActivity.set(next);
			}
		}
	});

	const animatedProps = useAnimatedProps(() => {
		const activity = screenActivity.get();
		return {
			activityState: activity,
			shouldFreeze: activity === ScreenActivity.INACTIVE && shouldFreeze,
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
