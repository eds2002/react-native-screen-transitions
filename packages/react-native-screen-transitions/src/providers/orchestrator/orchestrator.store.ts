import type { ReactNode } from "react";
import type { ScreenBounds } from "../../components/boundary/screen/use-screen-bounds";
import createProvider from "../../utils/create-provider";
import type { ScreenAnimationPipeline } from "./helpers/pipeline";

/**
 * A screen's orchestration: its animation pipeline and its bounds. The value is composed by
 * OrchestratorProvider (orchestrator.provider.tsx); the hooks that read it import only this module,
 * so reading it never imports what composes it.
 */
export type OrchestratorState = ScreenAnimationPipeline & ScreenBounds;

export const {
	StoreProvider: OrchestratorStoreProvider,
	OrchestratorProvider: ReusedOrchestratorProvider,
	useOptionalOrchestratorStore,
	useOrchestratorStore,
} = createProvider("Orchestrator", {
	global: true,
})<
	{ storeKey: string; value: OrchestratorState; children: ReactNode },
	OrchestratorState
>(({ storeKey, value, children }) => ({ key: storeKey, value, children }));
