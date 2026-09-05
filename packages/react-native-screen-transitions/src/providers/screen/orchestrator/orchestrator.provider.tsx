import { type ReactNode, useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import type { BoundsAccessor } from "../../../types/bounds.types";
import { createBoundsAccessor } from "../../../utils/bounds";
import createProvider from "../../../utils/create-provider";
import { useBuilderStore } from "../builder";
import { useMotionStore } from "../motion";
import { useScreenAnimationPipeline } from "./helpers/pipeline";
import { useRegisterGestureOwnership } from "./hooks/use-register-gesture-ownership";
import { useInterpolatedStylesMap } from "./styles/hooks/use-interpolated-style-maps";
import { useResolvedStylesMap } from "./styles/hooks/use-resolved-slot-style-map";

export type OrchestratorProviderProps = {
	children: ReactNode;
};

export type OrchestratorState = ReturnType<
	typeof useScreenAnimationPipeline
> & {
	boundsAccessor: BoundsAccessor;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
};

export const {
	StoreProvider: OrchestratorStoreProvider,
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
			boundsAccessor,
			slotsMap,
		},
	};
});
