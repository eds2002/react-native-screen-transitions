import { type ReactNode, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import type {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../constants";
import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import createProvider from "../../../utils/create-provider";
import { useDescriptorsStore } from "../descriptors";
import { useInterpolatedStylesMap } from "./hooks/use-interpolated-style-maps";
import { useMaybeBlockVisibility } from "./hooks/use-maybe-block-visibility";
import { useResolvedStylesMap } from "./hooks/use-resolved-slot-style-map";

type Props = {
	children: ReactNode;
};

export type ScreenSlotName =
	| "content"
	| "backdrop"
	| "surface"
	| typeof NAVIGATION_MASK_CONTAINER_STYLE_ID
	| typeof NAVIGATION_MASK_ELEMENT_STYLE_ID;

export type ScreenSlotContextValue = {
	interpolatorReady: SharedValue<number>;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	visibilityBlocked: SharedValue<boolean>;
};

export const { ScreenSlotProvider, useScreenSlotStore: useScreenSlots } =
	createProvider("ScreenSlot", {
		guarded: true,
		global: true,
	})<Props, ScreenSlotContextValue>(({ children }, { useParentStore }) => {
		const parentContext = useParentStore();
		const currentScreenKey = useDescriptorsStore(
			(store) => store.derivations.currentScreenKey,
		);
		const { animatedStyle, animatedProps, shouldBlockVisibility } =
			useMaybeBlockVisibility();

		const { interpolatorReady, localStylesMaps } = useInterpolatedStylesMap({
			enabled: true,
			visibilityBlocked: shouldBlockVisibility,
		});

		const slotsMap = useResolvedStylesMap({
			localStylesMaps,
			ancestorStylesMap: parentContext?.slotsMap,
		});
		const value = useMemo(
			() => ({
				interpolatorReady,
				slotsMap,
				visibilityBlocked: shouldBlockVisibility,
			}),
			[interpolatorReady, shouldBlockVisibility, slotsMap],
		);
		const content = useMemo(
			() => (
				<Animated.View
					style={[styles.container, animatedStyle]}
					animatedProps={animatedProps}
				>
					{children}
				</Animated.View>
			),
			[children, animatedStyle, animatedProps],
		);

		return {
			key: currentScreenKey,
			value,
			children: content,
		};
	});

const styles = StyleSheet.create({
	container: { flex: 1 },
});
