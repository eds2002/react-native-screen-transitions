import { memo, useCallback } from "react";
import {
	I18nManager,
	type LayoutChangeEvent,
	StyleSheet,
	View,
	type ViewProps,
	type ViewStyle,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { useOrchestratorStore } from "../../../providers/orchestrator/orchestrator.store";
import type { Layout } from "../../../types/screen.types";

type ClipStyles = { viewport: ViewStyle; content: ViewStyle };

type ClipStylesCache = {
	viewportKey: unknown[];
	contentKey: unknown[];
	styles: ClipStyles;
};

const haveSameValues = (a: unknown[], b: unknown[]) => {
	"worklet";
	if (a.length !== b.length) {
		return false;
	}
	for (let i = 0; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}
	return true;
};

/** Stable layout host: changing the viewport must never resize the screen. */
export const Clip = memo(
	({
		children,
		pointerEvents,
	}: {
		children: React.ReactNode;
		pointerEvents: ViewProps["pointerEvents"];
	}) => {
		const slotsMap = useOrchestratorStore((store) => store.slotsMap);
		const screenInterpolatorProps = useOrchestratorStore(
			(store) => store.screenInterpolatorProps,
		);
		const layout = useSharedValue<Layout | null>(null);
		const lastStyles = useSharedValue<ClipStylesCache | null>(null);

		const onLayout = useCallback(
			(event: LayoutChangeEvent) => {
				const { width, height } = event.nativeEvent.layout;
				layout.set({ width, height });
			},
			[layout],
		);

		const clippingStyles = useDerivedValue(() => {
			const clipStyle = slotsMap.get().clip?.style;
			// Reset-only slots have no rectangle dimensions.
			const clip =
				clipStyle?.width !== undefined && clipStyle.height !== undefined
					? clipStyle
					: undefined;
			// Keep content independent of the viewport, even before onLayout.
			const contentLayout =
				layout.get() ?? screenInterpolatorProps.get().layouts.screen;
			const x = clip?.x ?? 0;
			const y = clip?.y ?? 0;

			// Reanimated sends a style's every key whenever the object is not
			// shallow-equal to the last one, and a fresh `transform` array never
			// is. Reusing the previous objects while their inputs are unchanged
			// keeps width/height/overflow (layout props, which force a
			// shadow-tree commit) off the per-frame path.
			const viewportKey = [
				clip ? clip.width : "100%",
				clip ? clip.height : "100%",
				x,
				y,
				clip?.borderRadius,
				clip?.borderTopLeftRadius,
				clip?.borderTopRightRadius,
				clip?.borderBottomLeftRadius,
				clip?.borderBottomRightRadius,
				clip?.borderTopStartRadius,
				clip?.borderTopEndRadius,
				clip?.borderBottomStartRadius,
				clip?.borderBottomEndRadius,
				clip?.borderStartStartRadius,
				clip?.borderStartEndRadius,
				clip?.borderEndStartRadius,
				clip?.borderEndEndRadius,
				clip?.borderCurve,
			];
			const contentKey = [contentLayout.width, contentLayout.height, x, y];
			const previous = lastStyles.get();
			const viewport =
				previous && haveSameValues(previous.viewportKey, viewportKey)
					? previous.styles.viewport
					: ({
							width: clip ? clip.width : "100%",
							height: clip ? clip.height : "100%",
							overflow: clip ? "hidden" : "visible",
							borderRadius: clip?.borderRadius,
							borderTopLeftRadius: clip?.borderTopLeftRadius,
							borderTopRightRadius: clip?.borderTopRightRadius,
							borderBottomLeftRadius: clip?.borderBottomLeftRadius,
							borderBottomRightRadius: clip?.borderBottomRightRadius,
							borderTopStartRadius: clip?.borderTopStartRadius,
							borderTopEndRadius: clip?.borderTopEndRadius,
							borderBottomStartRadius: clip?.borderBottomStartRadius,
							borderBottomEndRadius: clip?.borderBottomEndRadius,
							borderStartStartRadius: clip?.borderStartStartRadius,
							borderStartEndRadius: clip?.borderStartEndRadius,
							borderEndStartRadius: clip?.borderEndStartRadius,
							borderEndEndRadius: clip?.borderEndEndRadius,
							borderCurve: clip?.borderCurve,
							transform: [{ translateX: x }, { translateY: y }],
						} satisfies ViewStyle);
			const content =
				previous && haveSameValues(previous.contentKey, contentKey)
					? previous.styles.content
					: {
							width: contentLayout.width,
							height: contentLayout.height,
							transform: [{ translateX: -x }, { translateY: -y }],
						};

			if (
				previous &&
				viewport === previous.styles.viewport &&
				content === previous.styles.content
			) {
				return previous.styles;
			}

			const styles = { viewport, content };
			lastStyles.set({ viewportKey, contentKey, styles });
			return styles;
		});

		const viewportStyle = useAnimatedStyle(() => clippingStyles.get().viewport);
		const innerStyle = useAnimatedStyle(() => clippingStyles.get().content);

		return (
			<View
				style={styles.host}
				onLayout={onLayout}
				pointerEvents={pointerEvents}
				collapsable={false}
			>
				<Animated.View
					style={[styles.viewport, viewportStyle]}
					pointerEvents={pointerEvents}
					collapsable={false}
				>
					<Animated.View
						style={[styles.inner, innerStyle]}
						pointerEvents={pointerEvents}
						collapsable={false}
					>
						{children}
					</Animated.View>
				</Animated.View>
			</View>
		);
	},
);

const styles = StyleSheet.create({
	host: { flex: 1 },
	// Pin to the physical left under both native layout directions.
	viewport: {
		position: "absolute",
		top: 0,
		...(I18nManager.isRTL ? { end: 0 } : { left: 0 }),
	},
	inner: {
		...(I18nManager.isRTL
			? { alignSelf: "flex-end" as const }
			: { alignSelf: "flex-start" as const }),
	},
});
