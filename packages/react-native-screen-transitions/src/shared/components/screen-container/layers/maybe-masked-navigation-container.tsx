import { memo, useCallback } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import Animated from "react-native-reanimated";
import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../constants";
import { useSlotStyles } from "../../../providers/screen/styles";
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
		if (!enabled || LazyMaskedView === View) {
			return children;
		}

		return (
			<MaskedNavigationContainer pointerEvents={pointerEvents}>
				{children}
			</MaskedNavigationContainer>
		);
	},
);

const MaskedNavigationContainer = memo(
	({
		children,
		pointerEvents,
	}: {
		children: React.ReactNode;
		pointerEvents: ViewProps["pointerEvents"];
	}) => {
		const maybeLogWarning = useCallback(() => {
			if (LazyMaskedView !== View) return;
			if (hasWarnedMissingMaskedView) return;

			hasWarnedMissingMaskedView = true;
			logger.warn(
				"navigationMaskEnabled requires @react-native-masked-view/masked-view. Install it to enable navigation bounds masking.",
			);
		}, []);

		const animatedNavigationMaskStyle = useSlotStyles(
			NAVIGATION_MASK_ELEMENT_STYLE_ID,
		);
		const animatedNavigationMaskContainerStyle = useSlotStyles(
			NAVIGATION_MASK_CONTAINER_STYLE_ID,
		);

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
				onLayout={maybeLogWarning}
			>
				<Animated.View
					style={[
						styles.navigationContainer,
						animatedNavigationMaskContainerStyle,
					]}
					collapsable={false}
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
	navigationContainer: {
		flex: 1,
	},
	navigationMaskElement: {
		backgroundColor: "white",
	},
});
