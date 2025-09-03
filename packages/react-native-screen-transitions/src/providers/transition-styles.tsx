import { createContext, useContext, useMemo } from "react";
import { isWorkletFunction, useDerivedValue } from "react-native-reanimated";
import { _useScreenAnimation } from "../hooks/animation/use-screen-animation";
import type { TransitionInterpolatedStyle } from "../types/animation";

type Props = {
	children: React.ReactNode;
};

const EMPTY_MAP = Object.freeze({});

const TransitionStylesContext = createContext<ReturnType<
	typeof useDerivedValue<TransitionInterpolatedStyle>
> | null>(null);

export function TransitionStylesProvider({ children }: Props) {
	const { screenInterpolatorProps, screenStyleInterpolator } =
		_useScreenAnimation();

	const isFunctionWorklet = isWorkletFunction(screenStyleInterpolator);

	const stylesMap = useDerivedValue<TransitionInterpolatedStyle>(() => {
		"worklet";

		if (screenStyleInterpolator && !isFunctionWorklet && __DEV__) {
			console.warn("screenStyleInterpolator is not a worklet function");
			return EMPTY_MAP;
		}

		return screenStyleInterpolator
			? screenStyleInterpolator(screenInterpolatorProps.value)
			: EMPTY_MAP;
	});

	const value = useMemo(() => stylesMap, [stylesMap]);

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
