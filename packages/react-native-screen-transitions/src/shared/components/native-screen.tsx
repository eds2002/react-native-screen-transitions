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
import { EPSILON } from "../constants";
import { useStack } from "../hooks/navigation/use-stack";
import { LayoutAnchorProvider } from "../providers/layout-anchor.provider";
import { useManagedStackContext } from "../providers/stack/managed.provider";
import { AnimationStore } from "../stores/animation.store";

const PASSTHROUGH = "passthrough";

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

const POINT_NONE = "none" as const;
const POINT_BOX_NONE = "box-none" as const;

const AnimatedNativeScreen = Animated.createAnimatedComponent(RNSScreen);

export const NativeScreen = ({
	routeKey,
	index,
	isPreloaded,
	children,
	freezeOnBlur,
	shouldFreeze,
}: ScreenProps) => {
	const {
		flags: { DISABLE_NATIVE_SCREENS = false },
		routes,
		optimisticFocusedIndex,
	} = useStack();
	const { activeScreensLimit, backdropBehaviors } = useManagedStackContext();

	const routesLength = routes.length;
	const screenRef = useAnimatedRef<View>();

	const sceneProgress = AnimationStore.getRouteAnimation(routeKey, "progress");
	const sceneClosing = AnimationStore.getRouteAnimation(routeKey, "closing");
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
		const isClosing = sceneClosing.get() > 0;
		const activeIndex = optimisticFocusedIndex.value;
		const isActive = index === activeIndex;

		// Check if the active screen allows passthrough to the screen below
		const activeBackdrop = backdropBehaviors[activeIndex] ?? "block";
		const activeAllowsPassthrough = activeBackdrop === PASSTHROUGH;
		const isAllowedPassthroughBelow =
			activeAllowsPassthrough && index === activeIndex - 1;

		// Determine pointer events:
		// - "none" if closing (immediately disable touches)
		// - "box-none" if this is the active screen
		// - "box-none" if the active screen allows passthrough and we're immediately below
		// - "none" otherwise (block touches to non-active screens)
		const pointerEvents =
			isClosing || (!isActive && !isAllowedPassthroughBelow)
				? POINT_NONE
				: POINT_BOX_NONE;

		if (!DISABLE_NATIVE_SCREENS) {
			return {
				activityState: activity,
				shouldFreeze: activity === ScreenActivity.INACTIVE && shouldFreeze,
				pointerEvents,
			};
		}

		return {
			pointerEvents,
		};
	});

	const NativeScreenComponent = !DISABLE_NATIVE_SCREENS
		? AnimatedNativeScreen
		: Animated.View;

	return (
		<NativeScreenComponent
			enabled
			ref={screenRef}
			style={StyleSheet.absoluteFill}
			freezeOnBlur={freezeOnBlur}
			animatedProps={animatedProps}
		>
			<LayoutAnchorProvider anchorRef={screenRef}>
				{children}
			</LayoutAnchorProvider>
		</NativeScreenComponent>
	);
};
