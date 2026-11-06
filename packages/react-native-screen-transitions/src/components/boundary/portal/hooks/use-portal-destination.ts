import { useAnimatedProps } from "react-native-reanimated";
import { useBoundaryRootStore } from "../../providers/boundary-root.provider";
import { useActiveHostKey } from "../stores/host-registry.store";
import { isBoundaryEscaped } from "../utils/is-escaped";
import {
	createHandoffHostName,
	PORTAL_HOST_NAME_RESET_VALUE,
} from "../utils/naming";
import { useActivePortalBoundaryHost } from "./use-active-portal-boundary-host";

export type PortalMode = "handoff" | "escapeClipping";

export function usePortalDestination(boundaryId: string, mode: PortalMode) {
	const {
		currentScreenKey,
		escapeMeasured,
		localMeasurement,
		portalHostReady,
		slotsMap,
		boundaryPresentation,
	} = useBoundaryRootStore((s) => s);
	// Every boundary can escape, but only one taking part in a transition needs a host in the
	// overlay: it registers the first time the boundary is measured for a pair (a source on press, a
	// destination on mount), not on mount. A long list of boundaries costs the overlay nothing.
	const escapeHostKey = useActiveHostKey(
		mode === "escapeClipping" && escapeMeasured ? currentScreenKey : null,
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
		const { receiver, slots } = boundaryPresentation.get();
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
			isBoundaryEscaped({
				boundaryId,
				presentation: boundaryPresentation,
				localMeasurement,
				portalHostReady,
			})
		) {
			hostName = portalHostName;
		}

		return { ...props, hostName };
	});
	return {
		pinned: escapeMeasured,
		teleportProps,
		localHostName: createHandoffHostName(currentScreenKey, boundaryId),
	};
}
