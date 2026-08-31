import { useCallback } from "react";
import {
	type LayoutChangeEvent,
	type StyleProp,
	StyleSheet,
	View,
	type ViewProps,
	type ViewStyle,
} from "react-native";
import { CONTAINER_STYLE_ID, MASK_STYLE_ID } from "../constants";
import type { TransitionClipMaximumSize } from "./clip-view";
import { createTransitionAwareComponent } from "./create-transition-aware-component";
import {
	LegacyGeometricClipView,
	UNMEASURED_LEGACY_CLIP_MAXIMUM_SIZE,
	useLegacyClipFootprint,
} from "./legacy-geometric-clip-view";

const TransitionView = createTransitionAwareComponent(View);

export type TransitionMaskedViewProps = Omit<
	ViewProps,
	"children" | "style"
> & {
	children: React.ReactNode;
	/** Optional fixed footprint; invalid/omitted values fall back to measurement. */
	maximumSize?: TransitionClipMaximumSize;
	style?: StyleProp<ViewStyle>;
};

/**
 * Geometric compatibility adapter for the removed alpha-mask dependency.
 *
 * The adapter uses finite numeric width/height immediately. Otherwise it keeps
 * the content in flow and unclipped until the root reports its first valid
 * layout. Opacity/translucent-background mask styles are intentionally not
 * approximated; the shared legacy projector warns once and restores this full
 * aperture instead.
 *
 * @deprecated Render `Transition.ClipView` with an explicit `clip` channel.
 */
export default function MaskedView({
	children,
	maximumSize,
	onLayout,
	style: userStyles,
	...viewProps
}: TransitionMaskedViewProps) {
	const { footprint, onLayout: measureFootprint } = useLegacyClipFootprint(
		userStyles,
		maximumSize,
	);
	const handleLayout = useCallback(
		(event: LayoutChangeEvent) => {
			measureFootprint(event);
			onLayout?.(event);
		},
		[measureFootprint, onLayout],
	);
	const resolvedFootprint = footprint ?? UNMEASURED_LEGACY_CLIP_MAXIMUM_SIZE;

	return (
		<View
			{...viewProps}
			collapsable={false}
			onLayout={handleLayout}
			style={styles.root}
		>
			<LegacyGeometricClipView
				layoutMode="fill"
				maximumSize={resolvedFootprint}
				streamEnabled={footprint !== null}
				styleId={MASK_STYLE_ID}
			>
				<TransitionView
					styleId={CONTAINER_STYLE_ID}
					style={[styles.rootContainer, userStyles]}
				>
					{children}
				</TransitionView>
			</LegacyGeometricClipView>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	rootContainer: {
		flex: 1,
	},
});
