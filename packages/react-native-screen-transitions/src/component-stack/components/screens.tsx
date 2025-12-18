import type * as React from "react";
import { StyleSheet } from "react-native";
import Animated, {
	interpolate,
	useAnimatedProps,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { useManagedStackContext } from "../../shared/providers/stack/managed.provider";
import { AnimationStore } from "../../shared/stores/animation.store";

interface ScreenProps {
	routeKey: string;
	index: number;
	children: React.ReactNode;
}

enum ScreenActivity {
	INACTIVE = 0,
	TRANSITIONING_OR_BELOW_TOP = 1,
	ON_TOP = 2,
}

const EPSILON = 1e-5;

export const Screen = ({ routeKey, index, children }: ScreenProps) => {
	const { activeScreensLimit, routes } = useManagedStackContext();
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
		// const activity = screenActivity.get();
		return {
			// activityState: activity,
			// shouldFreeze: activity === ScreenActivity.INACTIVE && shouldFreeze,
			pointerEvents: sceneClosing.get()
				? ("none" as const)
				: ("box-none" as const),
		};
	});

	return (
		<Animated.View style={StyleSheet.absoluteFill} animatedProps={animatedProps}>
			{children}
		</Animated.View>
	);
};
