/** biome-ignore-all lint/style/noNonNullAssertion: <Screen gesture is under the gesture context, so this will always exist.> */
import { type ComponentType, memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useDescriptorsStore } from "../../../providers/screen/descriptors";
import { useGestureStore } from "../../../providers/screen/gestures";
import { useSlotProps, useSlotStyles } from "../../../providers/screen/styles";
import type { ScreenContentComponentProps } from "../../../types";
import { ScreenFallbackHost } from "../../boundary/portal/components/boundary-portal/components/host";
import { useContentLayout } from "../hooks/use-content-layout";
import { MaybeMaskedNavigationContainer } from "./maybe-masked-navigation-container";
import { usesLayerRenderProps } from "./render-component";
import { SurfaceContainer } from "./surface-container";

type Props = {
	children: React.ReactNode;
	pointerEvents: "box-none" | undefined;
	isBackdropActive: boolean;
};

export const ContentLayer = memo(
	({ children, pointerEvents, isBackdropActive }: Props) => {
		const gestureContext = useGestureStore();
		const ContentComponent = useDescriptorsStore(
			(store) => store.options.contentComponent,
		);
		const isNavigationMaskEnabled = useDescriptorsStore(
			(store) => !!store.options.navigationMaskEnabled,
		);
		const hasAutoSnapPoint = useDescriptorsStore(
			(store) => store.options.snapPoints?.includes("auto") ?? false,
		);
		const contentPointerEvents = isBackdropActive ? "box-none" : pointerEvents;

		const AnimatedContentComponent = useMemo(() => {
			return ContentComponent && !usesLayerRenderProps(ContentComponent)
				? Animated.createAnimatedComponent(
						ContentComponent as ComponentType<any>,
					)
				: null;
		}, [ContentComponent]);

		const handleContentLayout = useContentLayout();

		const animatedContentStyle = useSlotStyles("content");
		const animatedContentProps = useSlotProps("content");
		const contentStyles = [
			styles.content,
			animatedContentStyle,
		] as ScreenContentComponentProps["styles"];
		const contentProps =
			animatedContentProps as ScreenContentComponentProps["props"];

		const contentChildren = (
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
					<ScreenFallbackHost />
				</SurfaceContainer>
			</MaybeMaskedNavigationContainer>
		);

		return (
			<GestureDetector gesture={gestureContext!.detectorGesture}>
				{AnimatedContentComponent ? (
					<AnimatedContentComponent
						style={contentStyles}
						animatedProps={animatedContentProps}
						pointerEvents={contentPointerEvents}
					>
						{contentChildren}
					</AnimatedContentComponent>
				) : ContentComponent ? (
					<ContentComponent
						styles={contentStyles}
						props={contentProps}
						pointerEvents={contentPointerEvents}
					>
						{contentChildren}
					</ContentComponent>
				) : (
					<Animated.View
						style={contentStyles}
						animatedProps={animatedContentProps}
						pointerEvents={contentPointerEvents}
					>
						{contentChildren}
					</Animated.View>
				)}
			</GestureDetector>
		);
	},
);

const styles = StyleSheet.create({
	content: {
		flex: 1,
	},
});
