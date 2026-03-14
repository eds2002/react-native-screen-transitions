import { memo, useEffect } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import {
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
	NO_STYLES,
} from "../../../constants";
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
		const animatedNavigationContainerStyle = useAnimatedStyle(() => {
			"worklet";
			return stylesMap.value[NAVIGATION_CONTAINER_STYLE_ID]?.style || NO_STYLES;
		});

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
						pointerEvents="none"
					/>
				}
				pointerEvents={pointerEvents}
			>
				<Animated.View
					style={[styles.navigationContainer, animatedNavigationContainerStyle]}
					pointerEvents={pointerEvents}
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
