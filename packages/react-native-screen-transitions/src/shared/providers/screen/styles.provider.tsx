import { createContext, useContext, useMemo } from "react";
import { type SharedValue, useDerivedValue } from "react-native-reanimated";
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

	const { screenInterpolatorProps, screenStyleInterpolator } =
		_useScreenAnimation();

	const stylesMap = useDerivedValue<TransitionInterpolatedStyle>(() => {
		"worklet";
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
