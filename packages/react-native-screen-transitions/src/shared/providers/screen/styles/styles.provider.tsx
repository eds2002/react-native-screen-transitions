import { type ReactNode, useContext } from "react";
import { StyleSheet } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import createProvider from "../../../utils/create-provider";
import { useInterpolatedStylesMap } from "./hooks/use-interpolated-style-maps";
import { useMaybeBlockVisibility } from "./hooks/use-maybe-block-visibility";
import { useResolvedStylesMap } from "./hooks/use-resolved-slot-style-map";

type Props = {
	children: ReactNode;
};

type ScreenStylesContextValue = {
	stylesMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
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

		const rawStylesMap = useInterpolatedStylesMap();

		const stylesMap = useResolvedStylesMap({
			currentStylesMap: rawStylesMap,
			ancestorStylesMap: parentContext?.stylesMap,
		});

		const { animatedStyle, animatedProps } = useMaybeBlockVisibility();

		return {
			value: {
				stylesMap,
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
