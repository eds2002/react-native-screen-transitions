import { type ReactNode, useContext, useMemo } from "react";
import {
	type SharedValue,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { NO_STYLES } from "../../../constants";
import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import createProvider from "../../../utils/create-provider";
import { logger } from "../../../utils/logger";
import { useScreenAnimationContext } from "../animation";
import {
	buildResolvedStyleMap,
	type StyleKeySet,
} from "./helpers/build-resolved-style-map";
import {
	PASS_THROUGH_STYLE_OUTPUT,
	resolveEffectiveResolutionMode,
	resolveInterpolatedStyleOutput,
	type ScreenStyleResolutionMode,
} from "./helpers/resolve-interpolated-style-output";
import { splitNormalizedStyleMaps } from "./helpers/split-normalized-style-maps";

type Props = {
	children: ReactNode;
};

type ScreenStylesContextValue = {
	layerStylesMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	elementStylesMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	resolutionMode: SharedValue<ScreenStyleResolutionMode>;
};

export const {
	ScreenStylesProvider,
	ScreenStylesContext,
	useScreenStylesContext: useScreenStyles,
} = createProvider("ScreenStyles", {
	guarded: true,
})<Props, ScreenStylesContextValue>(
	({ children }): { value: ScreenStylesContextValue; children: ReactNode } => {
		const parentContext = useContext(ScreenStylesContext);

		const {
			screenInterpolatorProps,
			nextInterpolator,
			currentInterpolator,
			boundsAccessor,
		} = useScreenAnimationContext();

		const isGesturingDuringCloseAnimation = useSharedValue(false);
		const hasWarnedLegacy = useSharedValue(false);
		const previousLayerStyleKeysBySlot = useSharedValue<
			Record<string, StyleKeySet>
		>({});
		const previousElementStyleKeysBySlot = useSharedValue<
			Record<string, StyleKeySet>
		>({});

		const rawStyleResolution = useDerivedValue<{
			layerStylesMap: NormalizedTransitionInterpolatedStyle;
			elementStylesMap: NormalizedTransitionInterpolatedStyle;
			resolutionMode: ScreenStyleResolutionMode;
		}>(() => {
			"worklet";
			const props = screenInterpolatorProps.value;
			const { current, next, progress } = props;
			const isDragging = current.gesture.dragging;
			const isNextClosing = !!next?.closing;

			if (isDragging && isNextClosing) {
				isGesturingDuringCloseAnimation.value = true;
			}

			if (!isDragging && !isNextClosing) {
				isGesturingDuringCloseAnimation.value = false;
			}

			const isInGestureMode =
				isDragging || isGesturingDuringCloseAnimation.value;

			const interpolator = isInGestureMode
				? currentInterpolator
				: (nextInterpolator ?? currentInterpolator);

			if (!interpolator) {
				return {
					layerStylesMap: NO_STYLES,
					elementStylesMap: NO_STYLES,
					resolutionMode: PASS_THROUGH_STYLE_OUTPUT.resolutionMode,
				};
			}

			let effectiveProgress = progress;
			let effectiveNext = next;

			if (isInGestureMode) {
				effectiveProgress = current.progress;
				effectiveNext = undefined;
			}

			try {
				const raw = interpolator({
					...props,
					progress: effectiveProgress,
					next: effectiveNext,
					bounds: boundsAccessor,
				});

				const { stylesMap, resolutionMode, wasLegacy } =
					resolveInterpolatedStyleOutput(raw);

				const { layerStylesMap, elementStylesMap } =
					splitNormalizedStyleMaps(stylesMap);

				if (__DEV__ && wasLegacy && !hasWarnedLegacy.value) {
					hasWarnedLegacy.value = true;
					logger.warn(
						"Flat interpolator return shape (contentStyle/backdropStyle) is deprecated. " +
							"Use the nested format instead: { content: { style }, backdrop: { style } }.",
					);
				}

				return {
					layerStylesMap,
					elementStylesMap,
					resolutionMode: resolveEffectiveResolutionMode({
						resolutionMode,
						isSettled: current.settled === 1,
					}),
				};
			} catch (err) {
				if (__DEV__) {
					console.warn(
						"[react-native-screen-transitions] screenStyleInterpolator must be a worklet",
						err,
					);
				}

				return {
					layerStylesMap: NO_STYLES,
					elementStylesMap: NO_STYLES,
					resolutionMode: "live" as const,
				};
			}
		});

		const layerStylesMap =
			useDerivedValue<NormalizedTransitionInterpolatedStyle>(() => {
				"worklet";
				const { resolvedStylesMap, nextPreviousStyleKeysBySlot } =
					buildResolvedStyleMap({
						currentStylesMap: rawStyleResolution.value.layerStylesMap,
						fallbackStylesMap: NO_STYLES,
						previousStyleKeysBySlot: previousLayerStyleKeysBySlot.value,
					});

				previousLayerStyleKeysBySlot.value = nextPreviousStyleKeysBySlot;
				return resolvedStylesMap;
			});

		const elementStylesMap =
			useDerivedValue<NormalizedTransitionInterpolatedStyle>(() => {
				"worklet";
				const { resolvedStylesMap, nextPreviousStyleKeysBySlot } =
					buildResolvedStyleMap({
						currentStylesMap: rawStyleResolution.value.elementStylesMap,
						fallbackStylesMap:
							parentContext?.elementStylesMap.value ?? NO_STYLES,
						previousStyleKeysBySlot: previousElementStyleKeysBySlot.value,
					});

				previousElementStyleKeysBySlot.value = nextPreviousStyleKeysBySlot;

				return resolvedStylesMap;
			});

		const resolutionMode = useDerivedValue<ScreenStyleResolutionMode>(() => {
			"worklet";
			return rawStyleResolution.value.resolutionMode;
		});

		const value = useMemo<ScreenStylesContextValue>(() => {
			return {
				layerStylesMap,
				elementStylesMap,
				resolutionMode,
			};
		}, [elementStylesMap, layerStylesMap, resolutionMode]);

		return { value, children };
	},
);
