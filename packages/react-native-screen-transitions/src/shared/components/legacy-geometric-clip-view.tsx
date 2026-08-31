import {
	type ComponentType,
	forwardRef,
	type ReactNode,
	useCallback,
	useMemo,
	useState,
} from "react";
import {
	type LayoutChangeEvent,
	type StyleProp,
	StyleSheet,
	type View,
	type ViewProps,
	type ViewStyle,
} from "react-native";
import {
	default as Animated,
	useAnimatedProps,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import {
	SmoothClipView,
	useSmoothClipDriver,
} from "react-native-smooth-clip-view";
import { NO_PROPS } from "../constants";
import { useLegacyClipStreamRegistration } from "../providers/screen/clip/clip-stream.provider";
import {
	INITIAL_LEGACY_CLIP_RENDER_STATE,
	resolveLegacyOverflowCarrierStyle,
} from "../providers/screen/clip/legacy-clip-fallback";
import { updateLegacyClipFootprint } from "../providers/screen/clip/legacy-clip-projector";
import {
	INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION,
	type TrustedSmoothClipNativePlan,
} from "../providers/screen/clips/coordinator/runtime-store";
import { useScreenSlots } from "../providers/screen/styles";
import type { NormalizedTransitionSlotStyle } from "../types/animation.types";
import {
	assertValidMaximumSize,
	createDefaultClipPresentation,
	type TransitionClipMaximumSize,
} from "./clip-view/helpers";

type LegacyGeometricClipViewProps = Omit<ViewProps, "children" | "style"> & {
	children?: ReactNode;
	contentStyle?: StyleProp<ViewStyle>;
	hostStyle?: StyleProp<ViewStyle>;
	/** Fill the stable parent wrapper instead of owning an in-flow footprint. */
	layoutMode?: "fill" | "fixed";
	maximumSize: TransitionClipMaximumSize;
	/** Keeps the full-aperture driver mounted without consuming its slot yet. */
	streamEnabled?: boolean;
	styleId: string;
	trustedPlans?: readonly TrustedSmoothClipNativePlan[];
};

/**
 * Oversized full aperture for the brief pre-measurement phase. SmoothClip
 * intersects it with the native host bounds, so the mounted host remains an
 * unclipped pass-through until the durable Yoga footprint is known.
 */
export const UNMEASURED_LEGACY_CLIP_MAXIMUM_SIZE = Object.freeze({
	height: 1_000_000,
	width: 1_000_000,
});

export const resolveNumericClipFootprint = (
	style: StyleProp<ViewStyle> | undefined,
): TransitionClipMaximumSize | null => {
	const flattened = StyleSheet.flatten(style);
	return updateLegacyClipFootprint(null, flattened?.width, flattened?.height);
};

/** Latches the latest valid in-flow layout while preferring explicit numbers. */
export const useLegacyClipFootprint = (
	style?: StyleProp<ViewStyle>,
	explicitFootprint?: TransitionClipMaximumSize,
): Readonly<{
	footprint: TransitionClipMaximumSize | null;
	onLayout: (event: LayoutChangeEvent) => void;
}> => {
	const explicit = useMemo(
		() =>
			updateLegacyClipFootprint(
				null,
				explicitFootprint?.width,
				explicitFootprint?.height,
			) ?? resolveNumericClipFootprint(style),
		[explicitFootprint?.height, explicitFootprint?.width, style],
	);
	const [measured, setMeasured] = useState<TransitionClipMaximumSize | null>(
		null,
	);
	const onLayout = useCallback((event: LayoutChangeEvent) => {
		const { height, width } = event.nativeEvent.layout;
		setMeasured((previous) =>
			updateLegacyClipFootprint(previous, width, height),
		);
	}, []);
	return { footprint: explicit ?? measured, onLayout };
};

const AnimatedSmoothClipView = Animated.createAnimatedComponent(SmoothClipView);
const AnimatedClipHost = AnimatedSmoothClipView as ComponentType<any>;

/** Internal host for the deprecated geometric style projector. */
export const LegacyGeometricClipView = forwardRef<
	View,
	LegacyGeometricClipViewProps
>(function LegacyGeometricClipView(
	{
		children,
		contentStyle,
		hostStyle,
		layoutMode = "fixed",
		maximumSize,
		streamEnabled = true,
		styleId,
		trustedPlans,
		...hostProps
	},
	forwardedRef,
) {
	assertValidMaximumSize(maximumSize);
	const { height, width } = maximumSize;
	const base = useMemo(
		() => createDefaultClipPresentation({ height, width }),
		[height, width],
	);
	const driver = useSmoothClipDriver(base, {
		velocityTracking:
			INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION && (trustedPlans?.length ?? 0) > 0,
	});
	const { slotsMap } = useScreenSlots();
	const renderState = useSharedValue(INITIAL_LEGACY_CLIP_RENDER_STATE);
	useLegacyClipStreamRegistration({
		base,
		driver,
		enabled: streamEnabled,
		footprint: maximumSize,
		renderState,
		slotsMap,
		styleId,
		trustedPlans,
	});
	const animatedHostProps = useAnimatedProps(() => {
		const slot = slotsMap.get()[styleId] as
			| NormalizedTransitionSlotStyle
			| undefined;
		if (slot?.props === undefined) return NO_PROPS;
		const { teleport: _teleport, ...props } = slot.props;
		return props;
	}, [styleId]);
	const overflowCarrierStyle = useAnimatedStyle(() => {
		const slot = slotsMap.get()[styleId] as
			| NormalizedTransitionSlotStyle
			| undefined;
		return resolveLegacyOverflowCarrierStyle(
			renderState.get().mode,
			slot?.style as Readonly<Record<string, unknown>> | undefined,
		) as ViewStyle;
	}, [styleId]);
	const footprintStyle =
		layoutMode === "fill" ? styles.fill : { height, width };

	return (
		<Animated.View
			collapsable={false}
			ref={forwardedRef as never}
			style={[styles.overflowCarrier, footprintStyle, overflowCarrierStyle]}
		>
			<AnimatedClipHost
				{...hostProps}
				animatedProps={animatedHostProps}
				collapsable={false}
				driver={driver}
				style={[hostStyle, footprintStyle]}
			>
				<Animated.View
					pointerEvents="box-none"
					style={[styles.content, contentStyle]}
				>
					{children}
				</Animated.View>
			</AnimatedClipHost>
		</Animated.View>
	);
});

LegacyGeometricClipView.displayName = "LegacyGeometricClipView";

const styles = StyleSheet.create({
	overflowCarrier: {
		position: "absolute",
	},
	fill: {
		bottom: 0,
		left: 0,
		position: "absolute",
		right: 0,
		top: 0,
	},
	content: {
		height: "100%",
		width: "100%",
	},
});
