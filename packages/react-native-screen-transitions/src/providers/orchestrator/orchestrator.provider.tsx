import { type ReactNode, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { NormalizedTransitionInterpolatedStyle } from "../../types/animation.types";
import type { BoundsAccessor } from "../../types/bounds.types";
import { createBoundsAccessor } from "../../utils/bounds";
import createProvider from "../../utils/create-provider";
import { useBuilderStore } from "../builder";
import { useMotionStore } from "../motion";
import { useScreenAnimationPipeline } from "./helpers/pipeline";
import { usePairPresentation } from "./helpers/use-pair-presentation";
import { useRegisterGestureOwnership } from "./hooks/use-register-gesture-ownership";
import { useInterpolatedStylesMap } from "./styles/hooks/use-interpolated-style-maps";
import { useResolvedStylesMap } from "./styles/hooks/use-resolved-slot-style-map";

export type OrchestratorProviderProps = {
	children: ReactNode;
	/** Reuse an existing screen’s orchestration without rebuilding it. */
	screenKey?: string;
};

export type OrchestratorState = ReturnType<
	typeof useScreenAnimationPipeline
> & {
	boundsAccessor: BoundsAccessor;
	pairPresentation: ReturnType<typeof usePairPresentation>;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
};

export const {
	OrchestratorProvider,
	useOptionalOrchestratorStore,
	useOrchestratorStore,
} = createProvider("Orchestrator", {
	global: true,
})<OrchestratorProviderProps, OrchestratorState>(() => {
	const currentScreenKey = useBuilderStore(
		(store) => store.derivations.currentScreenKey,
	);
	const gestures = useMotionStore((store) => store.gestures);

	const pipeline = useScreenAnimationPipeline();
	const pairPresentation = usePairPresentation(pipeline);

	const localStylesMaps = useInterpolatedStylesMap({ pipeline });
	const slotsMap = useResolvedStylesMap({ localStylesMaps });

	const { screenInterpolatorProps } = pipeline;

	const boundsAccessor = useMemo(
		() =>
			createBoundsAccessor(() => {
				"worklet";
				return screenInterpolatorProps.get();
			}),
		[screenInterpolatorProps],
	);

	useRegisterGestureOwnership({
		claimedDirections: gestures.claimedDirections,
		owners: gestures.owners,
		source: gestures,
	});

	return {
		key: currentScreenKey,
		value: {
			...pipeline,
			pairPresentation,
			boundsAccessor,
			slotsMap,
		},
	};
});
