import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useInterpolatorStyles } from "@/hooks/animation/use-interpolator-styles";

export const InterpolatorOverlayStyles = () => {
	const { overlayStyle } = useInterpolatorStyles();

	return (
		<Animated.View
			style={[StyleSheet.absoluteFillObject, overlayStyle]}
			pointerEvents="none"
		/>
	);
};
