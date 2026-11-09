import type { ReactNode } from "react";
import {
	type ScreenBounds,
	useScreenBounds,
} from "../../components/boundary/screen/use-screen-bounds";
import createProvider from "../../utils/create-provider";
import { useBuilderStore } from "../builder";
import { useMotionStore } from "../motion";
import { useScreenAnimationPipeline } from "./helpers/pipeline";
import { useRegisterGestureOwnership } from "./hooks/use-register-gesture-ownership";
import { useInterpolatedStylesMap } from "./styles/hooks/use-interpolated-style-maps";
import { useResolvedStylesMap } from "./styles/hooks/use-resolved-slot-style-map";

export type OrchestratorProviderProps = {
	children: ReactNode;
};

export type OrchestratorState = ReturnType<typeof useScreenAnimationPipeline> &
	ScreenBounds;

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
	const { localStylesMaps, interpolatorRuns } = useInterpolatedStylesMap({
		pipeline,
	});
	const resolvedSlotsMap = useResolvedStylesMap({ localStylesMaps });
	const bounds = useScreenBounds({
		currentScreenKey,
		pipeline,
		localStylesMaps,
		interpolatorRuns,
		resolvedSlotsMap,
	});

	useRegisterGestureOwnership({
		claimedDirections: gestures.claimedDirections,
		owners: gestures.owners,
		source: gestures,
	});

	return {
		key: currentScreenKey,
		value: { ...pipeline, ...bounds },
	};
});
