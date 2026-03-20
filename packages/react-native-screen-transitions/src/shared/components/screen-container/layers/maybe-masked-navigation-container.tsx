import { memo, useEffect } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { NAVIGATION_MASK_STYLE_ID, NO_STYLES } from "../../../constants";
import { useScreenStyles } from "../../../providers/screen/styles.provider";
import { logger } from "../../../utils/logger";

type Props = {
	enabled: boolean;
	children: React.ReactNode;
	pointerEvents: ViewProps["pointerEvents"];
};

let LazyMaskedView = View;

try {
	LazyMaskedView = require("@react-native-masked-view/masked-view").default;
} catch (_) {
	// optional peer dependency
}

let hasWarnedMissingMaskedView = false;

export const MaybeMaskedNavigationContainer = memo(
	({ enabled, children, pointerEvents }: Props) => {
		const { stylesMap } = useScreenStyles();
		const animatedNavigationMaskStyle = useAnimatedStyle(() => {
			"worklet";
			return stylesMap.value[NAVIGATION_MASK_STYLE_ID]?.style || NO_STYLES;
		});

		useEffect(() => {
			if (!enabled) return;
			if (LazyMaskedView !== View) return;
			if (hasWarnedMissingMaskedView) return;

			hasWarnedMissingMaskedView = true;
			logger.warn(
				"navigationMaskEnabled requires @react-native-masked-view/masked-view. Install it to enable navigation bounds masking.",
			);
		}, [enabled]);
		if (!enabled) return children;

		if (LazyMaskedView === View) {
			return children;
		}

		return (
			<LazyMaskedView
				style={styles.navigationMaskedRoot}
				// @ts-expect-error masked-view package types are too strict here
				maskElement={
					<Animated.View
						style={[styles.navigationMaskElement, animatedNavigationMaskStyle]}
						pointerEvents="none"
					/>
				}
				pointerEvents={pointerEvents}
			>
				{children}
			</LazyMaskedView>
		);
	},
);

const styles = StyleSheet.create({
	navigationMaskedRoot: {
		flex: 1,
	},
	navigationMaskElement: {
		backgroundColor: "white",
	},
});
