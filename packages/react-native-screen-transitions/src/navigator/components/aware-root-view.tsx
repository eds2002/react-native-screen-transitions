import { memo } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { FlickerGuard } from "@/components/flicker-prevention";
import { ScreenAnimationContext } from "@/navigator/contexts/screen-animation";
import { _useRootScreenAnimation } from "@/navigator/hooks/animation/use-root-screen-animation";
import { RootGestureHandlerProvider } from "@/navigator/providers/root-gesture-handler-provider";
import { additionalInterpolationProps } from "@/utils/animation/additional-interpolation-props";
import type { AwareContentProps } from "../types";

export const AwareRootView = memo(
	({ children, style, navigation }: AwareContentProps) => {
		const { interpolator, interpolatorProps } = _useRootScreenAnimation();

		const contentStyle = useAnimatedStyle(() => {
			"worklet";

			const props = additionalInterpolationProps(interpolatorProps);
			const styles = interpolator.screenStyleInterpolator(props);

			return styles.contentStyle || {};
		});

		const overlayStyle = useAnimatedStyle(() => {
			"worklet";

			const props = additionalInterpolationProps(interpolatorProps);
			const styles = interpolator.screenStyleInterpolator(props);

			return styles.overlayStyle || {};
		});

		return (
			<RootGestureHandlerProvider navigation={navigation}>
				<ScreenAnimationContext.Provider value={interpolatorProps}>
					<FlickerGuard.Root
						screenInterpolatorState={interpolator.screenInterpolatorState}
						interpolatorProps={interpolatorProps}
					>
						<Animated.View
							style={[StyleSheet.absoluteFillObject, overlayStyle]}
							pointerEvents="none"
						/>
						<Animated.View style={[{ flex: 1 }, style, contentStyle]}>
							{children}
						</Animated.View>
					</FlickerGuard.Root>
				</ScreenAnimationContext.Provider>
			</RootGestureHandlerProvider>
		);
	},
);

AwareRootView.displayName = "AwareRootView";
