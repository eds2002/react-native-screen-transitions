import type * as React from "react";
import { StyleSheet, type View } from "react-native";
import Animated, {
	Extrapolation,
	interpolate,
	useAnimatedProps,
	useAnimatedRef,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { Screen as RNSScreen } from "react-native-screens";
import { useStack } from "../../shared/hooks/navigation/use-stack";
import { LayoutAnchorProvider } from "../../shared/providers/layout-anchor.provider";
import { useManagedStackContext } from "../../shared/providers/stack/managed.provider";
import { AnimationStore } from "../../shared/stores/animation.store";

interface ScreenProps {
	routeKey: string;
	index: number;
	isPreloaded: boolean;
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
const POINT_NONE = "none" as const;
const POINT_BOX_NONE = "box-none" as const;

const AnimatedNativeScreen = Animated.createAnimatedComponent(RNSScreen);

export const AdjustedScreen = ({
	routeKey,
	index,
	isPreloaded,
	children,
	freezeOnBlur,
	shouldFreeze,
}: ScreenProps) => {
	const {
		flags: { DISABLE_NATIVE_SCREENS = false },
	} = useStack();
	const { activeScreensLimit, routes } = useManagedStackContext();
	const routesLength = routes.length;
	const screenRef = useAnimatedRef<View>();

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

		if (index < routesLength - activeScreensLimit - 1 || isPreloaded) {
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
				Extrapolation.CLAMP,
			);

			const next = Math.trunc(v) ?? ScreenActivity.TRANSITIONING_OR_BELOW_TOP;

			if (next !== screenActivity.get()) {
				screenActivity.set(next);
			}
		}
	});

	const animatedProps = useAnimatedProps(() => {
		const activity = screenActivity.get();
		if (!DISABLE_NATIVE_SCREENS) {
			return {
				activityState: activity,
				shouldFreeze: activity === ScreenActivity.INACTIVE && shouldFreeze,
				pointerEvents: sceneClosing.get() ? POINT_NONE : POINT_BOX_NONE,
			};
		}

		return {
			pointerEvents: sceneClosing.get() ? POINT_NONE : POINT_BOX_NONE,
		};
	});

	const AdjustedScreenComponent = !DISABLE_NATIVE_SCREENS
		? AnimatedNativeScreen
		: Animated.View;

	return (
		<AdjustedScreenComponent
			enabled
			ref={screenRef}
			style={StyleSheet.absoluteFill}
			freezeOnBlur={freezeOnBlur}
			animatedProps={animatedProps}
		>
			<LayoutAnchorProvider anchorRef={screenRef}>
				{children}
			</LayoutAnchorProvider>
		</AdjustedScreenComponent>
	);
};
