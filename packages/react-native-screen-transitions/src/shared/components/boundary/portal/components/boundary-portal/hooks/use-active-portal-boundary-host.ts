import { useCallback, useLayoutEffect, useState } from "react";
import {
	runOnJS,
	type SharedValue,
	useAnimatedReaction,
} from "react-native-reanimated";
import { pairs } from "../../../../../../stores/bounds/internals/state";
import type { ScreenPairKey } from "../../../../../../stores/bounds/types";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../../../types/animation.types";
import type { BoundaryLocalMeasurementValue } from "../../../../types";
import { createBoundaryPortalHostName } from "../../../utils/naming";
import { isTeleportEnabled } from "../../../utils/teleport-control";
import { resolveActiveBoundaryPortalPairKey } from "../helpers/local-measurement";
import {
	mountPortalBoundaryHost,
	unmountPortalBoundaryHostByName,
} from "../stores/portal-boundary-host.store";

type UseActivePortalBoundaryHostParams = {
	boundaryId: string;
	escapeHostKey?: string;
	localMeasurement: BoundaryLocalMeasurementValue;
	portalHostName: SharedValue<string | null>;
	portalHostReady: SharedValue<string | null>;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
};

export const useActivePortalBoundaryHost = ({
	boundaryId,
	escapeHostKey,
	localMeasurement,
	portalHostName,
	portalHostReady,
	slotsMap,
}: UseActivePortalBoundaryHostParams) => {
	const [activePairKey, setActivePairKey] = useState<ScreenPairKey | null>(
		null,
	);

	const updateActivePairKey = useCallback((pairKey: ScreenPairKey | null) => {
		setActivePairKey(pairKey);
	}, []);

	useAnimatedReaction(
		() => {
			"worklet";
			return resolveActiveBoundaryPortalPairKey(
				localMeasurement.get(),
				slotsMap.get()[boundaryId],
				boundaryId,
				pairs.get(),
			);
		},
		(pairKey, previousPairKey) => {
			"worklet";
			if (pairKey === previousPairKey) {
				return;
			}

			const slot = slotsMap.get()[boundaryId];
			if (
				pairKey === null &&
				localMeasurement.get() !== null &&
				slot &&
				!isTeleportEnabled(slot.props?.teleport)
			) {
				localMeasurement.set(null);
			}

			runOnJS(updateActivePairKey)(pairKey);
		},
	);

	useLayoutEffect(() => {
		if (!activePairKey || !escapeHostKey) {
			portalHostName.set(null);
			portalHostReady.set(null);
			return;
		}

		const nextPortalHostName = createBoundaryPortalHostName(
			escapeHostKey,
			boundaryId,
			activePairKey,
		);

		mountPortalBoundaryHost({
			boundaryId,
			hostKey: escapeHostKey,
			localMeasurement,
			pairKey: activePairKey,
			portalHostName: nextPortalHostName,
			portalHostReady,
			slotsMap,
		});
		portalHostName.set(nextPortalHostName);

		return () => {
			portalHostName.set(null);
			portalHostReady.set(null);
			unmountPortalBoundaryHostByName(nextPortalHostName);
		};
	}, [
		activePairKey,
		boundaryId,
		escapeHostKey,
		localMeasurement,
		portalHostName,
		portalHostReady,
		slotsMap,
	]);
};
