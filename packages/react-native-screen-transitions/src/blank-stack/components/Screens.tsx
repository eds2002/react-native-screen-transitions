import type { NavigationRoute, ParamListBase } from "@react-navigation/native";
import type * as React from "react";
import { StyleSheet } from "react-native";
import Animated, {
	interpolate,
	useAnimatedProps,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { Screen as RNSScreen } from "react-native-screens";
import { Animations } from "../../shared/stores/animations";

interface ScreenProps {
	routeKey: string;
	index: number;
	routes: NavigationRoute<ParamListBase, string>[];
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
	routes,
	isPreloaded,
	activeScreensLimit,
	children,
	freezeOnBlur,
	shouldFreeze,
}: ScreenProps) => {
	const sceneProgress = Animations.getAnimation(routeKey, "progress");
	const screenActivity = useSharedValue<0 | 1 | 2>(1);

	useDerivedValue(() => {
		if (!sceneProgress) {
			screenActivity.value = STATE_TRANSITIONING_OR_BELOW_TOP;
			return;
		}

		if (index < routes.length - activeScreensLimit - 1 || isPreloaded) {
			screenActivity.value = STATE_INACTIVE;
		} else {
			const outputValue =
				index === routes.length - 1
					? STATE_ON_TOP
					: index >= routes.length - activeScreensLimit
						? STATE_TRANSITIONING_OR_BELOW_TOP
						: STATE_INACTIVE;

			const v = interpolate(
				sceneProgress.value,
				[0, 1 - EPSILON, 1],
				[1, 1, outputValue],
				"clamp",
			);

			const next =
				(Math.trunc(v) as 0 | 1 | 2) ?? STATE_TRANSITIONING_OR_BELOW_TOP;

			// avoid spamming JS thread
			if (next !== screenActivity.value) {
				screenActivity.value = next;
			}
		}
	});

	const animatedProps = useAnimatedProps(() => {
		return {
			activityState: screenActivity.value,
			shouldFreeze: screenActivity.value === STATE_INACTIVE && shouldFreeze,
		};
	});

	return (
		<AnimatedScreen
			enabled
			style={StyleSheet.absoluteFill}
			pointerEvents="box-none"
			freezeOnBlur={freezeOnBlur}
			animatedProps={animatedProps}
		>
			{children}
		</AnimatedScreen>
	);
};
