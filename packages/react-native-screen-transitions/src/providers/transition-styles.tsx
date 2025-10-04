import { createContext, useContext, useMemo } from "react";
import { useDerivedValue } from "react-native-reanimated";
import { NO_STYLES } from "../constants";
import { _useScreenAnimation } from "../hooks/animation/use-screen-animation";
import type { TransitionInterpolatedStyle } from "../types/animation";
import { createBounds } from "../utils/bounds";

type Props = {
	children: React.ReactNode;
};

const TransitionStylesContext = createContext<ReturnType<
	typeof useMemo<{
		stylesMap: ReturnType<typeof useDerivedValue<TransitionInterpolatedStyle>>;
	}>
> | null>(null);

export function TransitionStylesProvider({ children }: Props) {
	const { screenInterpolatorProps, screenStyleInterpolator } =
		_useScreenAnimation();

	const stylesMap = useDerivedValue<TransitionInterpolatedStyle>(() => {
		"worklet";

		/**
		 * ### Maintainer note
		 *
		 * From my understanding, reanimated will serialize the DerivedValue result. Thus resulting in us receiving a `bounds is not a function, it is an object` error. We'll build the bounds function inside here (the final step) and pass it alongside the interpolator instead.
		 */
		const props = screenInterpolatorProps.value;

		const bounds = createBounds(props);
		try {
			if (!screenStyleInterpolator) return NO_STYLES;

			return screenStyleInterpolator({
				...props,
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
		return {
			stylesMap,
		};
	}, [stylesMap]);

	return (
		<TransitionStylesContext.Provider value={value}>
			{children}
		</TransitionStylesContext.Provider>
	);
}

export function useTransitionStyles() {
	const ctx = useContext(TransitionStylesContext);
	if (!ctx) {
		throw new Error(
			"useTransitionStyles must be used within a TransitionStylesProvider",
		);
	}
	return ctx;
}
