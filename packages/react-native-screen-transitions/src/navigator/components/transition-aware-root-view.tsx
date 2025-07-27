import type { ParamListBase } from "@react-navigation/native";
import type React from "react";
import { type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { RootGestureHandlerProvider } from "@/components/providers/root-gesture-handler-provider";
import { _useRootScreenAnimation } from "@/hooks/animation/use-root-screen-animation";
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

export const TransitionAwareRootView = ({
	children,
	currentScreenKey,
	previousScreenKey,
	nextScreenKey,
	style,
	navigation,
}: TransitionAwareRootViewProps) => {
	const { screenStyleInterpolator, ...rest } = _useRootScreenAnimation({
		currentScreenKey,
		previousScreenKey,
		nextScreenKey,
	});

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
		<RootGestureHandlerProvider
			currentScreenKey={currentScreenKey}
			navigation={navigation}
		>
			<Animated.View
				style={[StyleSheet.absoluteFillObject, overlayStyle]}
				pointerEvents="none"
			/>
			<Animated.View style={[{ flex: 1 }, style, contentStyle]}>
				{children}
			</Animated.View>
		</RootGestureHandlerProvider>
	);
};

TransitionAwareRootView.displayName = "TransitionAwareRootView";
