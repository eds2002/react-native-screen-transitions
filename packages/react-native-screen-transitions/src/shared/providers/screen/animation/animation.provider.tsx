import { createContext, type ReactNode, useContext, useMemo } from "react";
import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import type { ScreenInterpolationProps } from "../../../types/animation.types";
import { useScreenAnimationPipeline } from "./helpers/pipeline";

type Props = {
	children: ReactNode;
};

export type ScreenAnimationContextValue = ReturnType<
	typeof useScreenAnimationPipeline
> & {
	screenAnimation: DerivedValue<ScreenInterpolationProps>;
	ancestorScreenAnimations: DerivedValue<ScreenInterpolationProps>[];
};

const ScreenAnimationContext =
	createContext<ScreenAnimationContextValue | null>(null);
ScreenAnimationContext.displayName = "ScreenAnimation";

function ScreenAnimationProvider({ children }: Props) {
	const parentContext = useContext(ScreenAnimationContext);

	const {
		screenInterpolatorProps,
		nextInterpolator,
		currentInterpolator,
		boundsAccessor,
	} = useScreenAnimationPipeline();

	const screenAnimation = useDerivedValue<ScreenInterpolationProps>(() => {
		"worklet";
		const props = screenInterpolatorProps.value;
		return {
			...props,
			bounds: boundsAccessor,
		};
	});

	const ancestorScreenAnimations = useMemo(() => {
		if (!parentContext) {
			return [];
		}

		return [
			parentContext.screenAnimation,
			...parentContext.ancestorScreenAnimations,
		];
	}, [parentContext]);

	const value = useMemo(
		() => ({
			screenInterpolatorProps,
			nextInterpolator,
			currentInterpolator,
			boundsAccessor,
			screenAnimation,
			ancestorScreenAnimations,
		}),
		[
			screenInterpolatorProps,
			nextInterpolator,
			currentInterpolator,
			boundsAccessor,
			screenAnimation,
			ancestorScreenAnimations,
		],
	);

	return (
		<ScreenAnimationContext.Provider value={value}>
			{children}
		</ScreenAnimationContext.Provider>
	);
}

function useScreenAnimationContext(): ScreenAnimationContextValue {
	const context = useContext(ScreenAnimationContext);

	if (!context) {
		throw new Error(
			"ScreenAnimation context must be used within a ScreenAnimationProvider",
		);
	}

	return context;
}

export {
	ScreenAnimationContext,
	ScreenAnimationProvider,
	useScreenAnimationContext,
};
