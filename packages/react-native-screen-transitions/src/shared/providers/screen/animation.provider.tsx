import { type ReactNode, useMemo } from "react";
import { type DerivedValue, useDerivedValue } from "react-native-reanimated";
import { useScreenAnimationPipeline } from "../../hooks/animation/use-screen-animation/pipeline";
import type { ScreenInterpolationProps } from "../../types/animation.types";
import createProvider from "../../utils/create-provider";

type Props = {
	children: ReactNode;
};

type ScreenAnimationContextValue = ReturnType<
	typeof useScreenAnimationPipeline
> & {
	screenAnimation: DerivedValue<ScreenInterpolationProps>;
};

const { ScreenAnimationProvider, useScreenAnimationContext } = createProvider(
	"ScreenAnimation",
	{ guarded: true },
)<Props, ScreenAnimationContextValue>(() => {
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

	const value = useMemo(
		() => ({
			screenInterpolatorProps,
			nextInterpolator,
			currentInterpolator,
			boundsAccessor,
			screenAnimation,
		}),
		[
			screenInterpolatorProps,
			nextInterpolator,
			currentInterpolator,
			boundsAccessor,
			screenAnimation,
		],
	);

	return { value };
});

export { ScreenAnimationProvider, useScreenAnimationContext };
