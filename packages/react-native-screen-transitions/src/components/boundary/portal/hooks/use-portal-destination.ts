import { useAnimatedProps, useSharedValue } from "react-native-reanimated";
import { useBoundaryRootStore } from "../../providers/boundary-root.provider";
import { useActiveHostKey } from "../stores/host-registry.store";
import {
	createHandoffHostName,
	PORTAL_HOST_NAME_RESET_VALUE,
} from "../utils/naming";
import { useActivePortalBoundaryHost } from "./use-active-portal-boundary-host";

export type PortalMode = "handoff" | "escapeClipping";

export function usePortalDestination(boundaryId: string, mode: PortalMode) {
	const { currentScreenKey, localMeasurement, slotsMap, boundaryPresentation } =
		useBoundaryRootStore((s) => s);
	const portalHostReady = useSharedValue(false);
	const escapeHostKey = useActiveHostKey(
		mode === "escapeClipping" ? currentScreenKey : null,
	);
	const portalHostName = useActivePortalBoundaryHost({
		boundaryId,
		escapeHostKey,
		localMeasurement,
		portalHostReady,
		slotsMap,
	});
	const teleportProps = useAnimatedProps(() => {
		"worklet";
		const { owner, receiver, slots } = boundaryPresentation.get();
		const slot = slots[boundaryId];
		const {
			pointerEvents: _pointerEvents,
			handoffTarget: _handoffTarget,
			...props
		} = slot?.props ?? {};
		let hostName: string | null = PORTAL_HOST_NAME_RESET_VALUE;
		if (mode === "handoff") {
			hostName = createHandoffHostName(receiver, boundaryId);
		} else if (
			owner?.ready &&
			localMeasurement.get()?.pairKey === owner.pairKey &&
			slot !== undefined &&
			portalHostReady.get()
		) {
			hostName = portalHostName;
		}

		return { ...props, hostName };
	});
	return {
		teleportProps,
		localHostName: createHandoffHostName(currentScreenKey, boundaryId),
	};
}
