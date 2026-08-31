/** biome-ignore-all lint/style/noNonNullAssertion: <Screen gesture is under the gesture context, so this will always exist.> */
import { type ComponentType, memo, useCallback, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
	useAnimatedProps,
	useAnimatedStyle,
} from "react-native-reanimated";
import { NO_PROPS, NO_STYLES } from "../../../constants";
import {
	globalSmoothClipCoordinatorRuntime,
	INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION,
} from "../../../providers/screen/clips/coordinator/runtime-store";
import { useDescriptors } from "../../../providers/screen/descriptors";
import { useGestureContext } from "../../../providers/screen/gestures";
import { OriginProvider } from "../../../providers/screen/origin.provider";
import { useScreenSlots } from "../../../providers/screen/styles";
import { composeSlotStyleWithLocalTransform } from "../../../providers/screen/styles/helpers/compose-slot-style";
import type { ScreenContentComponentProps } from "../../../types";
import type { NormalizedTransitionSlotStyle } from "../../../types/animation.types";
import { REVEAL_CLIP_NATIVE_PLAN } from "../../../utils/bounds/navigation/reveal/native-plan";
import { ZOOM_CLIP_NATIVE_PLAN } from "../../../utils/bounds/navigation/zoom/native-plan";
import { ScreenFallbackHost } from "../../boundary/portal/components/boundary-portal/components/host";
import { ClipAperture } from "../../clip-view";
import { resolveScreenContentCarrierStyle } from "../../clip-view/helpers";
import { useContentLayout } from "../hooks/use-content-layout";
import {
	createPositiveMaximumSizeFallback,
	useFixedShellMaximumSize,
} from "../hooks/use-fixed-shell-maximum-size";
import { MaybeMaskedNavigationContainer } from "./maybe-masked-navigation-container";
import { usesLayerRenderProps } from "./render-component";
import { SurfaceContainer } from "./surface-container";

type Props = {
	children: React.ReactNode;
	pointerEvents: "box-none" | undefined;
	isBackdropActive: boolean;
};

type ContentClipSlot = NormalizedTransitionSlotStyle & {
	clip?: unknown;
};

const BUILT_IN_CONTENT_CLIP_PLANS = [
	ZOOM_CLIP_NATIVE_PLAN,
	REVEAL_CLIP_NATIVE_PLAN,
] as const;

export const ContentLayer = memo(
	({ children, pointerEvents, isBackdropActive }: Props) => {
		const { current } = useDescriptors();
		const window = useWindowDimensions();

		const gestureContext = useGestureContext();
		const ContentComponent = current.options.contentComponent;
		const isNavigationMaskEnabled = !!current.options.navigationMaskEnabled;
		const contentPointerEvents = isBackdropActive ? "box-none" : pointerEvents;

		const AnimatedContentComponent = useMemo(() => {
			return ContentComponent && !usesLayerRenderProps(ContentComponent)
				? Animated.createAnimatedComponent(
						ContentComponent as ComponentType<any>,
					)
				: null;
		}, [ContentComponent]);

		const hasAutoSnapPoint =
			current.options.snapPoints?.includes("auto") ?? false;

		const handleContentLayout = useContentLayout();
		const routeKey = current.route.key;
		const handleMaximumSizeChange = useCallback(() => {
			if (INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION) {
				globalSmoothClipCoordinatorRuntime.notifyRelayout(routeKey);
			}
		}, [routeKey]);

		const { slotsMap } = useScreenSlots();
		const animatedContentStyle = useAnimatedStyle(() => {
			const slot = slotsMap.get().content as ContentClipSlot | undefined;
			const composed = composeSlotStyleWithLocalTransform(
				slot?.style,
				undefined,
				slot?.boundsLocalTransform,
			);
			return resolveScreenContentCarrierStyle(
				composed ?? NO_STYLES,
				slot?.clip != null,
			);
		});
		const animatedContentProps = useAnimatedProps(() => {
			const slot = slotsMap.get().content as ContentClipSlot | undefined;
			return slot?.props ?? NO_PROPS;
		});
		const contentStyles = [
			styles.contentCarrier,
			animatedContentStyle,
		] as ScreenContentComponentProps["styles"];
		const contentProps =
			animatedContentProps as ScreenContentComponentProps["props"];

		const maximumSizeFallback = useMemo(
			() => createPositiveMaximumSizeFallback(window.width, window.height),
			[window.height, window.width],
		);
		const { maximumSize, onLayout: handleFixedShellLayout } =
			useFixedShellMaximumSize(maximumSizeFallback, handleMaximumSizeChange);
		const contentChildren = (
			<ClipAperture
				contentStyle={styles.apertureContent}
				hostStyle={styles.apertureHost}
				maximumSize={maximumSize}
				pointerEvents={contentPointerEvents}
				resolveSlotProps={false}
				styleId="content"
				trustedPlans={BUILT_IN_CONTENT_CLIP_PLANS}
			>
				<MaybeMaskedNavigationContainer
					pointerEvents={contentPointerEvents}
					enabled={isNavigationMaskEnabled}
					maximumSize={maximumSize}
				>
					<SurfaceContainer pointerEvents={contentPointerEvents}>
						<OriginProvider>
							{hasAutoSnapPoint ? (
								<View collapsable={false} onLayout={handleContentLayout}>
									{children}
								</View>
							) : (
								children
							)}
							<ScreenFallbackHost />
						</OriginProvider>
					</SurfaceContainer>
				</MaybeMaskedNavigationContainer>
			</ClipAperture>
		);

		return (
			<GestureDetector gesture={gestureContext!.detectorGesture}>
				<View
					collapsable={false}
					onLayout={handleFixedShellLayout}
					style={styles.fixedShell}
				>
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
				</View>
			</GestureDetector>
		);
	},
);

const styles = StyleSheet.create({
	apertureContent: {
		flex: 1,
	},
	apertureHost: {
		flex: 1,
	},
	contentCarrier: {
		flex: 1,
	},
	fixedShell: {
		flex: 1,
	},
});
