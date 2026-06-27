import { type ReactNode, useContext } from "react";
import { StyleSheet } from "react-native";
import Animated, {
	type SharedValue,
	useAnimatedProps,
	useAnimatedStyle,
} from "react-native-reanimated";
import {
	type NAVIGATION_MASK_CONTAINER_STYLE_ID,
	type NAVIGATION_MASK_ELEMENT_STYLE_ID,
	NO_PROPS,
	NO_STYLES,
} from "../../../constants";
import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import createProvider from "../../../utils/create-provider";
import { FloatingOverlayLayer } from "./components/floating-overlay-layer";
import { useInterpolatedStylesMap } from "./hooks/use-interpolated-style-maps";
import { useMaybeBlockVisibility } from "./hooks/use-maybe-block-visibility";
import { useResolvedStylesMap } from "./hooks/use-resolved-slot-style-map";

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

type ScreenSlotContextValue = {
	nextInterpolatorReady: SharedValue<number>;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
};

export const {
	ScreenSlotProvider,
	ScreenSlotContext,
	useScreenSlotContext: useScreenSlots,
} = createProvider("ScreenSlot", {
	guarded: true,
})<Props, ScreenSlotContextValue>(({ children, isFloatingOverlay }) => {
	const parentContext = useContext(ScreenSlotContext);

	const { localStylesMaps, nextInterpolatorReady } = useInterpolatedStylesMap();

	const slotsMap = useResolvedStylesMap({
		localStylesMaps,
		ancestorStylesMap: parentContext?.slotsMap,
	});
	const { animatedStyle, animatedProps } =
		useMaybeBlockVisibility(isFloatingOverlay);

	return {
		value: {
			nextInterpolatorReady,
			slotsMap,
		},
		children: (
			<FloatingOverlayLayer enabled={isFloatingOverlay}>
				<Animated.View
					style={[styles.container, animatedStyle]}
					animatedProps={animatedProps}
				>
					{children}
				</Animated.View>
			</FloatingOverlayLayer>
		),
	};
});

const styles = StyleSheet.create({
	container: { flex: 1 },
});

export const useSlotStyles = (slotId: string | undefined) => {
	const { slotsMap } = useScreenSlots();

	return useAnimatedStyle(() => {
		return (slotId ? slotsMap.get()[slotId]?.style : undefined) ?? NO_STYLES;
	});
};

/**
 * Stacking-only slice (`zIndex`/`elevation`) of a slot's style. Returned
 * separately so an owner can keep just its stacking context while a nested
 * target takes the full associated style. Yields `NO_STYLES` when neither is set.
 */
export const useSlotStackingStyles = (slotId: string | undefined) => {
	const { slotsMap } = useScreenSlots();

	return useAnimatedStyle(() => {
		const baseStyle = slotId ? slotsMap.get()[slotId]?.style : undefined;
		const zIndex = baseStyle?.zIndex ?? 0;
		const elevation = baseStyle?.elevation ?? 0;

		if (zIndex === 0 && elevation === 0) {
			return NO_STYLES;
		}

		return { zIndex, elevation };
	});
};

export const useSlotProps = (slotId: string | undefined) => {
	const { slotsMap } = useScreenSlots();

	return useAnimatedProps(() => {
		return (slotId ? slotsMap.get()[slotId]?.props : undefined) ?? NO_PROPS;
	});
};
