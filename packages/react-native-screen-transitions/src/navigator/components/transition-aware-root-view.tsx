import type { ParamListBase } from "@react-navigation/native";
import type React from "react";
import { type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { ScreenAnimationContext } from "@/navigator/contexts/screen-animation";
import { ScreenKeysContext } from "@/navigator/contexts/screen-keys";
import {
	_useRootScreenAnimation,
	useRootScreenAnimation,
} from "@/navigator/hooks/animation/use-root-screen-animation";
import { RootGestureHandlerProvider } from "@/navigator/providers/root-gesture-handler-provider";
import type { TransitionStackNavigationProp } from "@/types";
import { additionalInterpolationProps } from "@/utils/animation/additional-interpolation-props";

interface TransitionAwareRootViewProps {
	children: React.ReactNode;
	currentScreenKey: string;
	previousScreenKey?: string;
	nextScreenKey?: string;
	style?: StyleProp<ViewStyle>;
	navigation: TransitionStackNavigationProp<ParamListBase, string, undefined>;
}

const TransitionAwareContent = ({
	children,
	style,
	navigation,
}: {
	children: React.ReactNode;
	style?: StyleProp<ViewStyle>;
	navigation: TransitionStackNavigationProp<ParamListBase, string, undefined>;
}) => {
	const { screenStyleInterpolator, ...rest } = _useRootScreenAnimation();
	const interpolatedAnimation = useRootScreenAnimation();

	const contentStyle = useAnimatedStyle(() => {
		"worklet";
		const styles = screenStyleInterpolator(additionalInterpolationProps(rest));
		return styles.contentStyle || {};
	});

	const overlayStyle = useAnimatedStyle(() => {
		"worklet";
		const styles = screenStyleInterpolator(additionalInterpolationProps(rest));
		return styles.overlayStyle || {};
	});

	return (
		<RootGestureHandlerProvider navigation={navigation}>
			<ScreenAnimationContext.Provider value={interpolatedAnimation}>
				<Animated.View
					style={[StyleSheet.absoluteFillObject, overlayStyle]}
					pointerEvents="none"
				/>
				<Animated.View style={[{ flex: 1 }, style, contentStyle]}>
					{children}
				</Animated.View>
			</ScreenAnimationContext.Provider>
		</RootGestureHandlerProvider>
	);
};
export const TransitionAwareRootView = ({
	children,
	currentScreenKey,
	previousScreenKey,
	nextScreenKey,
	style,
	navigation,
}: TransitionAwareRootViewProps) => {
	return (
		<ScreenKeysContext.Provider
			value={{ currentScreenKey, previousScreenKey, nextScreenKey }}
		>
			<TransitionAwareContent style={style} navigation={navigation}>
				{children}
			</TransitionAwareContent>
		</ScreenKeysContext.Provider>
	);
};

TransitionAwareRootView.displayName = "TransitionAwareRootView";
