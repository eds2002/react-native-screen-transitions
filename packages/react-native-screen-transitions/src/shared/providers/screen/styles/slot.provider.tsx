import { type ReactNode, useContext } from "react";
import { StyleSheet } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import type {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../constants";
import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import createProvider from "../../../utils/create-provider";
import { FloatingOverlayLayer } from "./components/floating-overlay-layer";
import type { LocalStyleLayers } from "./helpers/resolve-slot-styles";
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
	localStylesMaps: SharedValue<LocalStyleLayers>;
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
			localStylesMaps,
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
