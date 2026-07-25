import { type ReactNode, useLayoutEffect, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import type {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../constants";
import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import createProvider from "../../../utils/create-provider";
import { useDescriptorsStore } from "../descriptors";
import { FloatingOverlayLayer } from "./components/floating-overlay-layer";
import type { LocalStyleLayers } from "./helpers/resolve-slot-styles";
import { useInterpolatedStylesMap } from "./hooks/use-interpolated-style-maps";
import { useMaybeBlockVisibility } from "./hooks/use-maybe-block-visibility";
import { useResolvedStylesMap } from "./hooks/use-resolved-slot-style-map";
import {
	registerScreenSlots,
	unregisterScreenSlots,
} from "./stores/slot-references.store";

type Props = {
	children: ReactNode;
	isFloatingOverlay?: boolean;
};

export type ScreenSlotName =
	| "content"
	| "backdrop"
	| "surface"
	| typeof NAVIGATION_MASK_CONTAINER_STYLE_ID
	| typeof NAVIGATION_MASK_ELEMENT_STYLE_ID;

export type ScreenSlotContextValue = {
	localStylesMaps: SharedValue<LocalStyleLayers>;
	nextInterpolatorReady: SharedValue<number>;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	visibilityBlocked: SharedValue<boolean>;
};

export const { ScreenSlotProvider, useScreenSlotStore: useScreenSlots } =
	createProvider("ScreenSlot", {
		guarded: true,
	})<Props, ScreenSlotContextValue>(
		({ children, isFloatingOverlay }, { useParentStore }) => {
			const parentContext = useParentStore();
			const currentScreenKey = useDescriptorsStore(
				(s) => s.derivations.currentScreenKey,
			);

			const { animatedStyle, animatedProps, shouldBlockVisibility } =
				useMaybeBlockVisibility(isFloatingOverlay);

			const { localStylesMaps, nextInterpolatorReady } =
				useInterpolatedStylesMap({
					enabled: !isFloatingOverlay,
					visibilityBlocked: shouldBlockVisibility,
				});

			const slotsMap = useResolvedStylesMap({
				localStylesMaps,
				ancestorStylesMap: parentContext?.slotsMap,
			});
			const value = useMemo(
				() => ({
					localStylesMaps,
					nextInterpolatorReady,
					slotsMap,
					visibilityBlocked: shouldBlockVisibility,
				}),
				[
					localStylesMaps,
					nextInterpolatorReady,
					shouldBlockVisibility,
					slotsMap,
				],
			);

			useLayoutEffect(() => {
				registerScreenSlots(currentScreenKey, value);

				return () => {
					unregisterScreenSlots(currentScreenKey, value);
				};
			}, [currentScreenKey, value]);

			const content = useMemo(
				() => (
					<FloatingOverlayLayer enabled={isFloatingOverlay}>
						<Animated.View
							style={[styles.container, animatedStyle]}
							animatedProps={animatedProps}
						>
							{children}
						</Animated.View>
					</FloatingOverlayLayer>
				),
				[children, animatedStyle, isFloatingOverlay, animatedProps],
			);

			return {
				value,
				children: content,
			};
		},
	);

const styles = StyleSheet.create({
	container: { flex: 1 },
});
