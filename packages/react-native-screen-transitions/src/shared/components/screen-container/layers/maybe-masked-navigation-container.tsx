import { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { NO_STYLES } from "../../../constants";
import { useScreenStyles } from "../../../providers/screen/styles.provider";
import {
	ZOOM_CONTAINER_STYLE_ID,
	ZOOM_MASK_STYLE_ID,
} from "../../../utils/bounds/zoom";
import { logger } from "../../../utils/logger";

type Props = {
	enabled: boolean;
	children: React.ReactNode;
};

let LazyMaskedView = View;

try {
	LazyMaskedView = require("@react-native-masked-view/masked-view").default;
} catch (_) {
	// optional peer dependency
}

let hasWarnedMissingMaskedView = false;

export const MaybeMaskedNavigationContainer = memo(
	({ enabled, children }: Props) => {
		const { stylesMap } = useScreenStyles();
		const animatedNavigationContainerStyle = useAnimatedStyle(() => {
			"worklet";
			return stylesMap.value[ZOOM_CONTAINER_STYLE_ID]?.style || NO_STYLES;
		});

		const animatedNavigationMaskStyle = useAnimatedStyle(() => {
			"worklet";
			return stylesMap.value[ZOOM_MASK_STYLE_ID]?.style || NO_STYLES;
		});

		useEffect(() => {
			if (!enabled) return;
			if (LazyMaskedView !== View) return;
			if (hasWarnedMissingMaskedView) return;

			hasWarnedMissingMaskedView = true;
			logger.warn(
				"maskEnabled requires @react-native-masked-view/masked-view. Install it to enable navigation bounds masking.",
			);
		}, [enabled]);

		if (!enabled) return children;

		if (LazyMaskedView === View) {
			return (
				<Animated.View
					style={[styles.navigationContainer, animatedNavigationContainerStyle]}
				>
					{children}
				</Animated.View>
			);
		}

		return (
			<LazyMaskedView
				style={styles.navigationMaskedRoot}
				// @ts-expect-error masked-view package types are too strict here
				maskElement={
					<Animated.View
						style={[styles.navigationMaskElement, animatedNavigationMaskStyle]}
					/>
				}
			>
				<Animated.View
					style={[styles.navigationContainer, animatedNavigationContainerStyle]}
				>
					{children}
				</Animated.View>
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
	navigationContainer: {
		flex: 1,
	},
});
