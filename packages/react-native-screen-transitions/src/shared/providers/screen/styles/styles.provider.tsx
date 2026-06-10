import { type ReactNode, useContext } from "react";
import { StyleSheet } from "react-native";
import Animated, { type SharedValue } from "react-native-reanimated";
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

type ScreenStylesContextValue = {
	stylesMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	shouldBlockVisibility: SharedValue<boolean>;
};

export const {
	ScreenStylesProvider,
	ScreenStylesContext,
	useScreenStylesContext: useScreenStyles,
} = createProvider("ScreenStyles", {
	guarded: true,
})<Props, ScreenStylesContextValue>(({ children, isFloatingOverlay }) => {
	const parentContext = useContext(ScreenStylesContext);

	const rawStylesMaps = useInterpolatedStylesMap();

	const { animatedStyle, animatedProps, shouldBlockVisibility } =
		useMaybeBlockVisibility(isFloatingOverlay);

	const stylesMap = useResolvedStylesMap({
		localStylesMaps: rawStylesMaps,
		ancestorStylesMap: parentContext?.stylesMap,
	});

	return {
		value: {
			stylesMap,
			shouldBlockVisibility,
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
