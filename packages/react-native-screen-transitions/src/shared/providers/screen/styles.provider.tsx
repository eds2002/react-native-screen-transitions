import { createContext, useContext, useMemo } from "react";
import {
	type SharedValue,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { NO_STYLES } from "../../constants";
import { _useScreenAnimation } from "../../hooks/animation/use-screen-animation";
import type { TransitionInterpolatedStyle } from "../../types/animation.types";
import { createBounds } from "../../utils/bounds";

type Props = {
	children: React.ReactNode;
};

type ScreenStylesContextValue = {
	stylesMap: SharedValue<TransitionInterpolatedStyle>;
	ancestorStylesMaps: SharedValue<TransitionInterpolatedStyle>[];
};

const ScreenStylesContext = createContext<ScreenStylesContextValue | null>(
	null,
);

export function ScreenStylesProvider({ children }: Props) {
	const parentCtx = useContext(ScreenStylesContext);

	const { screenInterpolatorProps, nextInterpolator, currentInterpolator } =
		_useScreenAnimation();

	// Track when a gesture is triggered while another screen is closing
	const hasTriggeredGestureWhileInFlight = useSharedValue(false);

	const stylesMap = useDerivedValue<TransitionInterpolatedStyle>(() => {
		"worklet";
		const props = screenInterpolatorProps.value;
		const bounds = createBounds(props);

		// Detect when user starts gesture on current screen while next screen is closing
		if (props.current.gesture.isDragging && props.next?.closing) {
			hasTriggeredGestureWhileInFlight.value = true;
		}

		// Reset the flag when no longer dragging and next screen is done closing
		if (
			!props.current.gesture.isDragging &&
			!props.next?.closing &&
			hasTriggeredGestureWhileInFlight.value
		) {
			hasTriggeredGestureWhileInFlight.value = false;
		}

		// Use current interpolator when gesture triggered while in-flight,
		// otherwise use next interpolator if available (normal case)
		const shouldUseCurrentInterpolator =
			props.current.gesture.isDragging ||
			hasTriggeredGestureWhileInFlight.value;

		const interpolator = shouldUseCurrentInterpolator
			? currentInterpolator
			: (nextInterpolator ?? currentInterpolator);

		/**
		 * Maintainer Note:
		 * To avoid unnecessary jumps in off directions, we have to snap back to the currents progress.
		 * While this still introduces a 'snap back' animation, it's still very rare that a user would encounter this unless
		 * they're spamming things out. Not ideal, but this is the best way to go about dealing with fast rapid gestures.
		 *
		 * The alternative was preventing users from actually being able to drag back while animation was still in flight. But there was a significant delay
		 * when waiting for gestures to register again.
		 */
		const effectiveProps = shouldUseCurrentInterpolator
			? { ...props, progress: props.current.progress, next: undefined }
			: props;

		try {
			if (!interpolator) return NO_STYLES;
			return interpolator({
				...effectiveProps,
				bounds,
			});
		} catch (err) {
			if (__DEV__) {
				console.warn(
					"[react-native-screen-transitions] screenStyleInterpolator must be a worklet",
					err,
				);
			}
			return NO_STYLES;
		}
	});

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
			"useTransitionStyles must be used within a TransitionStylesProvider",
		);
	}
	return ctx;
}
