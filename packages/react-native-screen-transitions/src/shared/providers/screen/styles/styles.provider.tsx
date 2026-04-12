import { type ReactNode, useContext } from "react";
import { StyleSheet } from "react-native";
import Animated, {
	type SharedValue,
	useDerivedValue,
} from "react-native-reanimated";
import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import createProvider from "../../../utils/create-provider";
import { useInterpolatedStyleMaps } from "./hooks/use-interpolated-style-maps";
import { useMaybeBlockVisibility } from "./hooks/use-maybe-block-visibility";
import { useResolvedSlotStyleMap } from "./hooks/use-resolved-slot-style-map";

type Props = {
	children: ReactNode;
};

type ScreenStylesContextValue = {
	layerStylesMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	elementStylesMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
};

export const {
	ScreenStylesProvider,
	ScreenStylesContext,
	useScreenStylesContext: useScreenStyles,
} = createProvider("ScreenStyles", {
	guarded: true,
})<Props, ScreenStylesContextValue>(
	({ children }): { value: ScreenStylesContextValue; children: ReactNode } => {
		const parentContext = useContext(ScreenStylesContext);

		const styleMaps = useInterpolatedStyleMaps();

		const rawLayerStylesMap = useDerivedValue(() => {
			"worklet";
			return styleMaps.get().layerStylesMap;
		});

		const rawElementStylesMap = useDerivedValue(() => {
			"worklet";
			return styleMaps.get().elementStylesMap;
		});

		const layerStylesMap = useResolvedSlotStyleMap({
			currentStylesMap: rawLayerStylesMap,
		});

		const elementStylesMap = useResolvedSlotStyleMap({
			currentStylesMap: rawElementStylesMap,
			fallbackStylesMap: parentContext?.elementStylesMap,
		});

		const { animatedStyle, animatedProps } = useMaybeBlockVisibility();

		return {
			value: {
				layerStylesMap,
				elementStylesMap,
			},
			children: (
				<Animated.View
					style={[styles.container, animatedStyle]}
					animatedProps={animatedProps}
				>
					{children}
				</Animated.View>
			),
		};
	},
);

const styles = StyleSheet.create({
	container: { flex: 1 },
});
