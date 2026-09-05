import { useAnimatedProps, useSharedValue } from "react-native-reanimated";
import { useBuilderStore } from "../../../../../../providers/screen/builder";
import { useOrchestratorStore } from "../../../../../../providers/screen/orchestrator";
import { useBoundaryRootStore } from "../../../../providers/boundary-root.provider";
import { PORTAL_HOST_NAME_RESET_VALUE } from "../../../utils/naming";
import { useActiveHostKey } from "../stores/host-registry.store";
import { useActivePortalBoundaryHost } from "./use-active-portal-boundary-host";

interface UseBoundaryPortalAttachmentParams {
	boundaryId: string;
}

export const useBoundaryPortalAttachment = ({
	boundaryId,
}: UseBoundaryPortalAttachmentParams) => {
	const localMeasurement = useBoundaryRootStore((root) => {
		if (!root) {
			throw new Error("Boundary portal attachment requires a boundary root.");
		}

		return root.localMeasurement;
	});
	const currentScreenKey = useBuilderStore(
		(s) => s.derivations.currentScreenKey,
	);
	const slotsMap = useOrchestratorStore((store) => store.slotsMap);
	const portalHostName = useSharedValue<string | null>(null);
	const portalHostReady = useSharedValue(false);
	const escapeHostKey = useActiveHostKey(currentScreenKey);

	useActivePortalBoundaryHost({
		boundaryId,
		currentScreenKey,
		escapeHostKey,
		localMeasurement,
		portalHostName,
		portalHostReady,
		slotsMap,
	});

	const teleportProps = useAnimatedProps(() => {
		"worklet";

		const slot = slotsMap.get()[boundaryId];
		const {
			pointerEvents: _pointerEvents,
			handoffTarget: _handoffTarget,
			...slotProps
		} = slot?.props ?? {};

		const shouldAttach = slot !== undefined && portalHostReady.get();

		const hostName = shouldAttach
			? portalHostName.get()
			: PORTAL_HOST_NAME_RESET_VALUE;

		return {
			...slotProps,
			hostName,
		};
	});

	return { teleportProps };
};
