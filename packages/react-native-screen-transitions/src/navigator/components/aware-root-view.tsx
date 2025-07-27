import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { ScreenAnimationContext } from "@/navigator/contexts/screen-animation";
import { ScreenKeysContext } from "@/navigator/contexts/screen-keys";
import {
	_useRootScreenAnimation,
	useRootScreenAnimation,
} from "@/navigator/hooks/animation/use-root-screen-animation";
import { RootGestureHandlerProvider } from "@/navigator/providers/root-gesture-handler-provider";
import { ScreenInterpolatorState } from "@/types/state";
import { additionalInterpolationProps } from "@/utils/animation/additional-interpolation-props";
import type { AwareContentProps, AwareRootViewProps } from "../types";
import { FlickerPrevention } from "./flicker-prevention";

const AwareContent = ({ children, style, navigation }: AwareContentProps) => {
	const { screenStyleInterpolator, screenInterpolatorState, ...rest } =
		_useRootScreenAnimation();
	const interpolatedAnimation = useRootScreenAnimation();

	const contentStyle = useAnimatedStyle(() => {
		"worklet";

		const interpolationProps = additionalInterpolationProps(rest);

		const styles = screenStyleInterpolator(interpolationProps);

		return styles.contentStyle || {};
	});

	const overlayStyle = useAnimatedStyle(() => {
		"worklet";

		const interpolationProps = additionalInterpolationProps(rest);

		const styles = screenStyleInterpolator(interpolationProps);

		return styles.overlayStyle || {};
	});

	return (
		<RootGestureHandlerProvider navigation={navigation}>
			<ScreenAnimationContext.Provider value={interpolatedAnimation}>
				<FlickerPrevention
					screenInterpolatorState={screenInterpolatorState}
					baseInterpolationProps={rest}
				>
					<Animated.View
						style={[StyleSheet.absoluteFillObject, overlayStyle]}
						pointerEvents="none"
					/>
					<Animated.View style={[{ flex: 1 }, style, contentStyle]}>
						{children}
					</Animated.View>
				</FlickerPrevention>
			</ScreenAnimationContext.Provider>
		</RootGestureHandlerProvider>
	);
};
export const AwareRootView = ({
	children,
	currentScreenKey,
	previousScreenKey,
	nextScreenKey,
	style,
	navigation,
}: AwareRootViewProps) => {
	return (
		<ScreenKeysContext.Provider
			value={{ currentScreenKey, previousScreenKey, nextScreenKey }}
		>
			<AwareContent style={style} navigation={navigation}>
				{children}
			</AwareContent>
		</ScreenKeysContext.Provider>
	);
};

AwareRootView.displayName = "AwareRootView";

// const contentStyle = useAnimatedStyle(() => {
//   "worklet";

//   const interpolationProps = additionalInterpolationProps(rest);

//   if (
//     screenInterpolatorState === ScreenInterpolatorState.UNDETERMINED &&
//     interpolationProps.isFocused
//   ) {
//     return { opacity: 0 };
//   }

//   // Safety net: If first DEFINED frame has empty styles at progress 0, hide 1 more frame
//   const styles = screenStyleInterpolator(interpolationProps);
//   const isEmpty =
//     !styles.contentStyle || Object.keys(styles.contentStyle).length === 0;

//   // Safety net, we'll skip 1 frame
//   if (
//     screenInterpolatorState === ScreenInterpolatorState.DEFINED &&
//     interpolationProps.animating.value === 1 &&
//     interpolationProps.current.progress.value === 0 &&
//     isEmpty
//   ) {
//     return { opacity: 0 };
//   }

//   return { ...styles.contentStyle, opacity: 1 };
// });
