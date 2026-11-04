import { useLayoutEffect } from "react";
import type { SharedValue } from "react-native-reanimated";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../types/animation.types";
import type { BoundaryLocalMeasurementValue } from "../../types";
import {
	mountPortalBoundaryHost,
	unmountPortalBoundaryHostByName,
} from "../stores/portal-boundary-host.store";
import { createBoundaryPortalHostName } from "../utils/naming";

// Hosts belong to mounted boundaries, not animation phases. React prepares
// them once; attachment and release are entirely UI-thread decisions.
export const useActivePortalBoundaryHost = ({
	boundaryId,
	escapeHostKey,
	localMeasurement,
	portalHostReady,
	slotsMap,
}: {
	boundaryId: string;
	escapeHostKey?: string;
	localMeasurement: BoundaryLocalMeasurementValue;
	portalHostReady: SharedValue<boolean>;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
}) => {
	const portalHostName = escapeHostKey
		? createBoundaryPortalHostName(escapeHostKey, boundaryId)
		: null;

	useLayoutEffect(() => {
		if (!escapeHostKey || !portalHostName) return;

		mountPortalBoundaryHost({
			boundaryId,
			hostKey: escapeHostKey,
			localMeasurement,
			portalHostName,
			portalHostReady,
			slotsMap,
		});

		return () => unmountPortalBoundaryHostByName(portalHostName);
	}, [
		boundaryId,
		escapeHostKey,
		localMeasurement,
		portalHostName,
		portalHostReady,
		slotsMap,
	]);
	return portalHostName;
};
