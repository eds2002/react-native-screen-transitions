import { memo } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { Flicker } from "@/components/flicker";

import { RootGestureHandlerProvider } from "@/navigator/providers/root-gesture-handler-provider";
import { _useAnimatedStyle } from "../hooks/animation/use-animated-style";
import type { AwareContentProps } from "../types";
import { _useScreenAnimation } from "./providers/screen-animation-provider";

export const AwareRootView = memo(
	({ children, style, navigation }: AwareContentProps) => {
		const { screenInterpolatorState, screenStyleInterpolator } =
			_useScreenAnimation();

		const contentStyle = _useAnimatedStyle((props) => {
			"worklet";

			return screenStyleInterpolator(props).contentStyle || {};
		});

		const overlayStyle = _useAnimatedStyle((props) => {
			"worklet";

			return screenStyleInterpolator(props).overlayStyle || {};
		});

		return (
			<RootGestureHandlerProvider navigation={navigation}>
				<Flicker.Navigator screenInterpolatorState={screenInterpolatorState}>
					<Animated.View
						style={[StyleSheet.absoluteFillObject, overlayStyle]}
						pointerEvents="none"
					/>
					<Animated.View style={[{ flex: 1 }, style, contentStyle]}>
						{children}
					</Animated.View>
				</Flicker.Navigator>
			</RootGestureHandlerProvider>
		);
	},
);

AwareRootView.displayName = "AwareRootView";
