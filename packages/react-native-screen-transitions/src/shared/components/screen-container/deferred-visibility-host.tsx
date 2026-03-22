import { memo } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { HIDDEN_STYLE, VISIBLE_STYLE } from "../../constants";
import { useScreenStyles } from "../../providers/screen/styles.provider";

type Props = {
	children: React.ReactNode;
};

/**
 * Hides the full screen visual subtree while an interpolator explicitly reports
 * that it is not safe to reveal yet.
 *
 * This sits above backdrop/content/mask/surface so a deferred transition does
 * not leak raw first-paint UI from nested layers.
 */
export const DeferredVisibilityHost = memo(({ children }: Props) => {
	const { resolutionMode } = useScreenStyles();

	const animatedStyle = useAnimatedStyle(() => {
		"worklet";
		return resolutionMode.value === "deferred" ? HIDDEN_STYLE : VISIBLE_STYLE;
	});

	return (
		<Animated.View collapsable={false} style={[styles.host, animatedStyle]}>
			{children}
		</Animated.View>
	);
});

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
});
