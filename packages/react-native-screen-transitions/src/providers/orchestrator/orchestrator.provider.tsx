import type { ReactNode } from "react";
import { useScreenBounds } from "../../components/boundary/screen/use-screen-bounds";
import { useBuilderStore } from "../builder";
import { useMotionStore } from "../motion/motion.store";
import { useScreenAnimationPipeline } from "./helpers/pipeline";
import { useRegisterGestureOwnership } from "./hooks/use-register-gesture-ownership";
import {
	OrchestratorStoreProvider,
	ReusedOrchestratorProvider,
} from "./orchestrator.store";
import { useInterpolatedStylesMap } from "./styles/hooks/use-interpolated-style-maps";
import { useResolvedStylesMap } from "./styles/hooks/use-resolved-slot-style-map";

const ComposedOrchestrator = ({ children }: { children: ReactNode }) => {
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

	return (
		<OrchestratorStoreProvider
			storeKey={currentScreenKey}
			value={{ ...pipeline, ...bounds, interpolatorRuns }}
		>
			{children}
		</OrchestratorStoreProvider>
	);
};

/**
 * Orchestrates the screen it is rendered in; with `screenKey`, provides that screen's existing
 * orchestration instead (an overlay rendered outside the screen).
 */
export const OrchestratorProvider = (
	props: { children: ReactNode } | { screenKey: string; children: ReactNode },
) =>
	"screenKey" in props ? (
		<ReusedOrchestratorProvider screenKey={props.screenKey}>
			{props.children}
		</ReusedOrchestratorProvider>
	) : (
		<ComposedOrchestrator>{props.children}</ComposedOrchestrator>
	);
