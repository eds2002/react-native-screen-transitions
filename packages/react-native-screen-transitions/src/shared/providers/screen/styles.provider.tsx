import { createContext, useContext, useMemo } from "react";
import {
	type SharedValue,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { NO_STYLES } from "../../constants";
import { _useScreenAnimation } from "../../hooks/animation/use-screen-animation";
import type { NormalizedTransitionInterpolatedStyle } from "../../types/animation.types";
import { logger } from "../../utils/logger";
import { normalizeInterpolatedStyle } from "../../utils/normalize-interpolated-style";

type Props = {
	children: React.ReactNode;
};

type ScreenStylesContextValue = {
	stylesMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	ancestorStylesMaps: SharedValue<NormalizedTransitionInterpolatedStyle>[];
};

const ScreenStylesContext = createContext<ScreenStylesContextValue | null>(
	null,
);

export function ScreenStylesProvider({ children }: Props) {
	const parentCtx = useContext(ScreenStylesContext);

	const {
		screenInterpolatorProps,
		nextInterpolator,
		currentInterpolator,
		boundsAccessor,
	} = _useScreenAnimation();

	/**
	 * Tracks when user starts a gesture while another screen is still closing.
	 * This persists until both the gesture ends AND the closing animation completes.
	 */
	const isGesturingDuringCloseAnimation = useSharedValue(false);
	const hasWarnedLegacy = useSharedValue(false);

	const stylesMap = useDerivedValue<NormalizedTransitionInterpolatedStyle>(
		() => {
			"worklet";
			const props = screenInterpolatorProps.value;
			const { current, next, progress } = props;
			const isDragging = current.gesture.isDragging;
			const isNextClosing = !!next?.closing;

			if (isDragging && isNextClosing) {
				isGesturingDuringCloseAnimation.value = true;
			}

			if (!isDragging && !isNextClosing) {
				isGesturingDuringCloseAnimation.value = false;
			}

			const isInGestureMode =
				isDragging || isGesturingDuringCloseAnimation.value;

			// Select interpolator
			//  - If in gesture mode, use current screen's interpolator since we're driving
			//    the animation from this screen (dragging back to dismiss next).
			const interpolator = isInGestureMode
				? currentInterpolator
				: (nextInterpolator ?? currentInterpolator);

			if (!interpolator)
				return NO_STYLES as NormalizedTransitionInterpolatedStyle;

			// Build effective props with corrected progress
			//  - Gesture mode: use current.progress only (avoids jumps during drag)
			//  - Normal: use derived progress as-is

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

				return result;
			} catch (err) {
				if (__DEV__) {
					console.warn(
						"[react-native-screen-transitions] screenStyleInterpolator must be a worklet",
						err,
					);
				}
				return NO_STYLES as NormalizedTransitionInterpolatedStyle;
			}
		},
	);

	const value = useMemo(() => {
		// Build ancestor chain: [parent, grandparent, great-grandparent, ...]
		const ancestorStylesMaps = parentCtx
			? [parentCtx.stylesMap, ...parentCtx.ancestorStylesMaps]
			: [];

		return {
			stylesMap,
			ancestorStylesMaps,
		};
	}, [stylesMap, parentCtx]);

	return (
		<ScreenStylesContext.Provider value={value}>
			{children}
		</ScreenStylesContext.Provider>
	);
}

export function useScreenStyles() {
	const ctx = useContext(ScreenStylesContext);
	if (!ctx) {
		throw new Error(
			"useScreenStyles must be used within a ScreenStylesProvider",
		);
	}
	return ctx;
}
