import { type ReactNode, useContext } from "react";
import createProvider from "../../../utils/create-provider";
import { useScreenAnimationPipeline } from "./helpers/pipeline";
import type { ScreenAnimationSource } from "./types";

type Props = {
	children: ReactNode;
};

export type ScreenAnimationContextValue = ReturnType<
	typeof useScreenAnimationPipeline
> & {
	ancestorScreenAnimationSources: ScreenAnimationSource[];
};

export type ScreenAnimationContextResult = {
	value: ScreenAnimationContextValue;
};

export const {
	ScreenAnimationProvider,
	ScreenAnimationContext,
	useScreenAnimationContext,
} = createProvider("ScreenAnimation", {
	guarded: true,
})<Props, ScreenAnimationContextValue>((): ScreenAnimationContextResult => {
	const parentContext = useContext(ScreenAnimationContext);

	const {
		screenInterpolatorProps,
		nextInterpolator,
		currentInterpolator,
		boundsAccessor,
	} = useScreenAnimationPipeline();

	const ancestorScreenAnimationSources = parentContext
		? [
				{
					screenInterpolatorProps: parentContext.screenInterpolatorProps,
					boundsAccessor: parentContext.boundsAccessor,
				},
				...parentContext.ancestorScreenAnimationSources,
			]
		: [];

	return {
		value: {
			screenInterpolatorProps,
			nextInterpolator,
			currentInterpolator,
			boundsAccessor,
			ancestorScreenAnimationSources,
		},
	};
});
