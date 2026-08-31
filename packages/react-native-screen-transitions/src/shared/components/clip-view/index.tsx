import { type ComponentType, forwardRef, type ReactNode, useMemo } from "react";
import {
	type StyleProp,
	StyleSheet,
	type View,
	type ViewProps,
	type ViewStyle,
} from "react-native";
import Animated, {
	useAnimatedProps,
	useAnimatedStyle,
} from "react-native-reanimated";
import {
	type SmoothClipPresentation,
	SmoothClipView,
	useSmoothClipDriver,
} from "react-native-smooth-clip-view";
import { NO_PROPS, NO_STYLES } from "../../constants";
import { useClipStreamRegistration } from "../../providers/screen/clip/clip-stream.provider";
import {
	INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION,
	type TrustedSmoothClipNativePlan,
} from "../../providers/screen/clips/coordinator/runtime-store";
import { useScreenSlots } from "../../providers/screen/styles";
import { composeSlotStyleWithLocalTransform } from "../../providers/screen/styles/helpers/compose-slot-style";
import type { NormalizedTransitionSlotStyle } from "../../types/animation.types";
import { logger } from "../../utils/logger";
import {
	assertValidMaximumSize,
	createDefaultClipPresentation,
	resolveClipHostStyle,
	resolveClipVisualCarrierStyle,
	type TransitionClipMaximumSize,
} from "./helpers";

type ClipSlot = NormalizedTransitionSlotStyle & {
	clip?: SmoothClipPresentation | null;
};

const AnimatedSmoothClipView = Animated.createAnimatedComponent(SmoothClipView);
const AnimatedClipHost = AnimatedSmoothClipView as ComponentType<any>;

export type TransitionClipViewProps = Omit<ViewProps, "children" | "style"> & {
	/** Base aperture restored when the transition slot stops emitting clip. */
	clip?: SmoothClipPresentation;
	children?: ReactNode;
	/** Styles applied to the payload inside the aperture. */
	contentStyle?: StyleProp<ViewStyle>;
	/** Styles applied to the native host. Dimension-affecting values are ignored. */
	hostStyle?: StyleProp<ViewStyle>;
	/** Fixed Yoga/native-host footprint used for every presentation. */
	maximumSize: TransitionClipMaximumSize;
	/** Explicit transition slot that owns this aperture. */
	styleId: string;
};

type ClipHostUnitProps = TransitionClipViewProps & {
	absolute?: boolean;
	outerStyle?: StyleProp<ViewStyle>;
	resolveSlotStyle?: boolean;
};

type ClipApertureProps = TransitionClipViewProps & {
	absolute?: boolean;
	resolveSlotProps?: boolean;
	trustedPlans?: readonly TrustedSmoothClipNativePlan[];
};

/**
 * Internal aperture primitive without a visual carrier. Screen content uses
 * this so a custom contentComponent remains the single outer carrier while
 * public and boundary ClipViews add their own carrier around the aperture.
 */
export const ClipAperture = forwardRef<View, ClipApertureProps>(
	function ClipAperture(
		{
			absolute = false,
			clip,
			children,
			contentStyle,
			hostStyle,
			maximumSize,
			resolveSlotProps = true,
			styleId,
			trustedPlans,
			...hostProps
		},
		forwardedRef,
	) {
		assertValidMaximumSize(maximumSize);
		const maximumWidth = maximumSize.width;
		const maximumHeight = maximumSize.height;
		const base = useMemo(
			() =>
				clip ??
				createDefaultClipPresentation({
					height: maximumHeight,
					width: maximumWidth,
				}),
			[clip, maximumHeight, maximumWidth],
		);
		const driver = useSmoothClipDriver(base, {
			velocityTracking:
				INTERNAL_SMOOTH_CLIP_NATIVE_PROMOTION &&
				(trustedPlans?.length ?? 0) > 0,
		});
		const { slotsMap } = useScreenSlots();
		useClipStreamRegistration({
			base,
			driver,
			slotsMap,
			styleId,
			trustedPlans,
		});
		const { hasConflictingDimensions, resolvedHostStyle } = useMemo(
			() => resolveClipHostStyle(StyleSheet.flatten(hostStyle)),
			[hostStyle],
		);
		const animatedHostProps = useAnimatedProps(() => {
			if (!resolveSlotProps) return NO_PROPS;
			const slot = slotsMap.get()[styleId] as ClipSlot | undefined;
			if (slot?.props === undefined) return NO_PROPS;
			const { teleport: _teleport, ...props } = slot.props;
			return props;
		}, [resolveSlotProps, styleId]);

		if (__DEV__ && hasConflictingDimensions) {
			logger.warnOnce(
				`clip:owned-host-size:${styleId}`,
				`Transition.ClipView "${styleId}" ignores dimension-affecting hostStyle values because maximumSize owns the native host dimensions.`,
			);
		}

		return (
			<AnimatedClipHost
				{...hostProps}
				animatedProps={animatedHostProps}
				collapsable={false}
				driver={driver}
				ref={forwardedRef as never}
				style={[
					resolvedHostStyle,
					absolute && styles.absoluteHost,
					{
						height: maximumHeight,
						width: maximumWidth,
					},
				]}
			>
				<Animated.View
					pointerEvents="box-none"
					style={[styles.content, contentStyle]}
				>
					{children}
				</Animated.View>
			</AnimatedClipHost>
		);
	},
);

ClipAperture.displayName = "Transition.ClipView.Aperture";

export const ClipHostUnit = forwardRef<View, ClipHostUnitProps>(
	function ClipHostUnit(
		{
			absolute = false,
			clip,
			children,
			contentStyle,
			hostStyle,
			maximumSize,
			outerStyle,
			resolveSlotStyle = true,
			styleId,
			...hostProps
		},
		forwardedRef,
	) {
		const { slotsMap } = useScreenSlots();

		const animatedCarrierStyle = useAnimatedStyle(() => {
			if (!resolveSlotStyle) return NO_STYLES;
			const slot = slotsMap.get()[styleId] as ClipSlot | undefined;
			const composed = composeSlotStyleWithLocalTransform(
				slot?.style,
				undefined,
				slot?.boundsLocalTransform,
			);
			return resolveClipVisualCarrierStyle(composed, slot?.clip != null);
		}, [resolveSlotStyle, styleId]);

		return (
			<Animated.View
				pointerEvents="box-none"
				style={[outerStyle, animatedCarrierStyle]}
			>
				<ClipAperture
					{...hostProps}
					absolute={absolute}
					clip={clip}
					contentStyle={contentStyle}
					hostStyle={hostStyle}
					maximumSize={maximumSize}
					ref={forwardedRef}
					styleId={styleId}
				>
					{children}
				</ClipAperture>
			</Animated.View>
		);
	},
);

ClipHostUnit.displayName = "Transition.ClipView.HostUnit";

export const TransitionClipView = forwardRef<View, TransitionClipViewProps>(
	(props, ref) => <ClipHostUnit {...props} ref={ref} />,
);

TransitionClipView.displayName = "Transition.ClipView";

const styles = StyleSheet.create({
	absoluteHost: {
		left: 0,
		position: "absolute",
		top: 0,
	},
	content: {
		height: "100%",
		width: "100%",
	},
});

export type { TransitionClipMaximumSize } from "./helpers";
