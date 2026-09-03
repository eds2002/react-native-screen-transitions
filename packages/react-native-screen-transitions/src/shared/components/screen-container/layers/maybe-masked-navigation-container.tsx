import { memo } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import Animated from "react-native-reanimated";
import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "../../../constants";
import { useSlotStyles } from "../../../providers/screen/styles";
import { REVEAL_CLIP_NATIVE_PLAN } from "../../../utils/bounds/navigation/reveal/native-plan";
import { ZOOM_CLIP_NATIVE_PLAN } from "../../../utils/bounds/navigation/zoom/native-plan";
import type { TransitionClipMaximumSize } from "../../clip-view";
import { LegacyGeometricClipView } from "../../legacy-geometric-clip-view";

type Props = {
	enabled: boolean;
	children: React.ReactNode;
	pointerEvents: ViewProps["pointerEvents"];
	maximumSize: TransitionClipMaximumSize;
};

const BUILT_IN_NAVIGATION_MASK_CLIP_PLANS = [
	ZOOM_CLIP_NATIVE_PLAN,
	REVEAL_CLIP_NATIVE_PLAN,
] as const;

export const MaybeMaskedNavigationContainer = memo(
	({ enabled, children, maximumSize, pointerEvents }: Props) => {
		if (!enabled) {
			return children;
		}

		return (
			<MaskedNavigationContainer
				maximumSize={maximumSize}
				pointerEvents={pointerEvents}
			>
				{children}
			</MaskedNavigationContainer>
		);
	},
);

const MaskedNavigationContainer = memo(
	({
		children,
		maximumSize,
		pointerEvents,
	}: {
		children: React.ReactNode;
		maximumSize: TransitionClipMaximumSize;
		pointerEvents: ViewProps["pointerEvents"];
	}) => {
		const animatedNavigationMaskContainerStyle = useSlotStyles(
			NAVIGATION_MASK_CONTAINER_STYLE_ID,
		);
		const content = (
			<Animated.View
				style={[
					styles.navigationContainer,
					animatedNavigationMaskContainerStyle,
				]}
				collapsable={false}
			>
				{children}
			</Animated.View>
		);

		return (
			<View
				style={styles.navigationMaskedRoot}
				collapsable={false}
				pointerEvents={pointerEvents}
			>
				<LegacyGeometricClipView
					layoutMode="fill"
					maximumSize={maximumSize}
					styleId={NAVIGATION_MASK_ELEMENT_STYLE_ID}
					trustedPlans={BUILT_IN_NAVIGATION_MASK_CLIP_PLANS}
				>
					{content}
				</LegacyGeometricClipView>
			</View>
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
});
