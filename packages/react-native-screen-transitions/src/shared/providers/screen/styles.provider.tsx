import { type ReactNode, useContext, useMemo } from "react";
import {
	type SharedValue,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import {
	EPSILON,
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
	NO_STYLES,
} from "../../constants";
import type { NormalizedTransitionInterpolatedStyle } from "../../types/animation.types";
import createProvider from "../../utils/create-provider";
import { logger } from "../../utils/logger";
import { normalizeInterpolatedStyle } from "../../utils/normalize-interpolated-style";
import {
	reconcileRootSlotProps,
	reconcileRootSlotStyle,
} from "../../utils/reconcile-root-slot-entry";
import { useScreenAnimationContext } from "./animation";

type Props = {
	children: ReactNode;
};

type ScreenStylesContextValue = {
	stylesMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	ancestorStylesMaps: SharedValue<NormalizedTransitionInterpolatedStyle>[];
};

const ROOT_SCREEN_SLOT_IDS = [
	"content",
	"backdrop",
	"surface",
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
] as const;

const {
	ScreenStylesProvider,
	ScreenStylesContext,
	useScreenStylesContext: useScreenStyles,
} = createProvider("ScreenStyles", {
	guarded: true,
})<Props, ScreenStylesContextValue>(
	({ children }): { value: ScreenStylesContextValue; children: ReactNode } => {
		const parentCtx = useContext(ScreenStylesContext);

		const {
			screenInterpolatorProps,
			nextInterpolator,
			currentInterpolator,
			boundsAccessor,
		} = useScreenAnimationContext();

		/**
		 * Tracks when user starts a gesture while another screen is still closing.
		 * This persists until both the gesture ends AND the closing animation completes.
		 */
		const isGesturingDuringCloseAnimation = useSharedValue(false);
		const hasWarnedLegacy = useSharedValue(false);
		const previousRootStyleKeys = useSharedValue<
			Record<string, Record<string, true>>
		>({});
		const previousRootPropKeys = useSharedValue<
			Record<string, Record<string, true>>
		>({});
		const lastResolvedRootStyles = useSharedValue<
			Record<string, Record<string, any> | null>
		>({});
		const lastResolvedRootProps = useSharedValue<
			Record<string, Record<string, any> | null>
		>({});

		const stylesMap = useDerivedValue<NormalizedTransitionInterpolatedStyle>(
			() => {
				"worklet";
				const props = screenInterpolatorProps.value;
				const { current, next, progress, active } = props;
				const isDragging = Boolean(current.gesture.dragging);
				const isNextClosing = Boolean(next?.closing);

				if (isDragging && isNextClosing) {
					isGesturingDuringCloseAnimation.value = true;
				}

				if (!isDragging && !isNextClosing) {
					isGesturingDuringCloseAnimation.value = false;
				}

				const isInGestureMode =
					isDragging || isGesturingDuringCloseAnimation.value;

				const isTransitionInFlight = Boolean(
					isInGestureMode ||
						active.animating ||
						active.closing ||
						progress < 1 - EPSILON,
				);

				// Select interpolator
				//  - If in gesture mode, use current screen's interpolator since we're driving
				//    the animation from this screen (dragging back to dismiss next).
				const interpolator = isInGestureMode
					? currentInterpolator
					: (nextInterpolator ?? currentInterpolator);

				let normalizedResult =
					NO_STYLES as NormalizedTransitionInterpolatedStyle;

				// Build effective props with corrected progress
				//  - Gesture mode: use current.progress only (avoids jumps during drag)
				//  - Normal: use derived progress as-is

				let effectiveProgress = progress;
				let effectiveNext = next;

				if (isInGestureMode) {
					effectiveProgress = current.progress;
					effectiveNext = undefined;
				}

				if (interpolator) {
					try {
						const raw = interpolator({
							...props,
							progress: effectiveProgress,
							next: effectiveNext,
							bounds: boundsAccessor,
						});

						const { result, wasLegacy } = normalizeInterpolatedStyle(
							raw as Record<string, any>,
						);

						if (__DEV__ && wasLegacy && !hasWarnedLegacy.value) {
							hasWarnedLegacy.value = true;
							logger.warn(
								"Flat interpolator return shape (contentStyle/backdropStyle) is deprecated. " +
									"Use the nested format instead: { content: { style }, backdrop: { style } }.",
							);
						}

						normalizedResult = result;
					} catch (err) {
						if (__DEV__) {
							console.warn(
								"[react-native-screen-transitions] screenStyleInterpolator must be a worklet",
								err,
							);
						}
						normalizedResult =
							NO_STYLES as NormalizedTransitionInterpolatedStyle;
					}
				}

				const nextRootStyleKeys: Record<string, Record<string, true>> = {};
				const nextRootPropKeys: Record<string, Record<string, true>> = {};
				const nextLastResolvedRootStyles: Record<
					string,
					Record<string, any> | null
				> = {};
				const nextLastResolvedRootProps: Record<
					string,
					Record<string, any> | null
				> = {};
				const reconciledResult = {
					...normalizedResult,
				} as NormalizedTransitionInterpolatedStyle;

				for (const slotId of ROOT_SCREEN_SLOT_IDS) {
					const currentSlot = normalizedResult[slotId];
					const styleResult = reconcileRootSlotStyle({
						current: currentSlot?.style,
						previousKeys: previousRootStyleKeys.value[slotId],
						lastResolved: lastResolvedRootStyles.value[slotId],
						isTransitionInFlight,
					});

					const propsResult = reconcileRootSlotProps({
						current: currentSlot?.props,
						previousKeys: previousRootPropKeys.value[slotId],
						lastResolved: lastResolvedRootProps.value[slotId],
						isTransitionInFlight,
					});

					nextRootStyleKeys[slotId] = styleResult.nextKeys;
					nextRootPropKeys[slotId] = propsResult.nextKeys;
					nextLastResolvedRootStyles[slotId] = styleResult.nextLastResolved;
					nextLastResolvedRootProps[slotId] = propsResult.nextLastResolved;

					if (!styleResult.hasValue && !propsResult.hasValue) {
						reconciledResult[slotId] = undefined;
						continue;
					}

					reconciledResult[slotId] = {
						...currentSlot,
						...(styleResult.hasValue ? { style: styleResult.value } : {}),
						...(propsResult.hasValue ? { props: propsResult.value } : {}),
					};
				}

				previousRootStyleKeys.value = nextRootStyleKeys;
				previousRootPropKeys.value = nextRootPropKeys;
				lastResolvedRootStyles.value = nextLastResolvedRootStyles;
				lastResolvedRootProps.value = nextLastResolvedRootProps;

				return reconciledResult;
			},
		);

		const value = useMemo<ScreenStylesContextValue>(() => {
			// Build ancestor chain: [parent, grandparent, great-grandparent, ...]
			const ancestorStylesMaps = parentCtx
				? [parentCtx.stylesMap, ...parentCtx.ancestorStylesMaps]
				: [];

			return {
				stylesMap,
				ancestorStylesMaps,
			};
		}, [stylesMap, parentCtx]);

		return { value, children };
	},
);

export { ScreenStylesProvider, useScreenStyles };
