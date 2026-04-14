/** biome-ignore-all lint/style/noNonNullAssertion: <Screen gesture is under the gesture context, so this will always exist.> */
import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
	useAnimatedProps,
	useAnimatedStyle,
} from "react-native-reanimated";
import { NO_PROPS, NO_STYLES } from "../../../constants";
import { useGestureContext } from "../../../providers/gestures";
import { useDescriptors } from "../../../providers/screen/descriptors";
import { useScreenStyles } from "../../../providers/screen/styles";
import { useContentLayout } from "../hooks/use-content-layout";
import { MaybeMaskedNavigationContainer } from "./maybe-masked-navigation-container";
import { SurfaceContainer } from "./surface-container";

type Props = {
	children: React.ReactNode;
	pointerEvents: "box-none" | undefined;
	isBackdropActive: boolean;
};

export const ContentLayer = memo(
	({ children, pointerEvents, isBackdropActive }: Props) => {
		const { stylesMap } = useScreenStyles();
		const { current } = useDescriptors();

		const gestureContext = useGestureContext();

		const isNavigationMaskEnabled = !!current.options.navigationMaskEnabled;

		const contentPointerEvents = isBackdropActive ? "box-none" : pointerEvents;

		const hasAutoSnapPoint =
			current.options.snapPoints?.includes("auto") ?? false;

		const handleContentLayout = useContentLayout();

		const animatedContentStyle = useAnimatedStyle(() => {
			"worklet";
			return stylesMap.get().content?.style || NO_STYLES;
		});

		const animatedContentProps = useAnimatedProps(() => {
			"worklet";
			return stylesMap.get().content?.props ?? NO_PROPS;
		});

		return (
			<GestureDetector gesture={gestureContext!.detectorGesture}>
				<Animated.View
					style={[styles.content, animatedContentStyle]}
					animatedProps={animatedContentProps}
					pointerEvents={contentPointerEvents}
				>
					<MaybeMaskedNavigationContainer
						pointerEvents={contentPointerEvents}
						enabled={isNavigationMaskEnabled}
					>
						<SurfaceContainer pointerEvents={contentPointerEvents}>
							{hasAutoSnapPoint ? (
								<View collapsable={false} onLayout={handleContentLayout}>
									{children}
								</View>
							) : (
								children
							)}
						</SurfaceContainer>
					</MaybeMaskedNavigationContainer>
				</Animated.View>
			</GestureDetector>
		);
	},
);

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
});
