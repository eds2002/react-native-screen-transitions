import { useCallback, useLayoutEffect, useState } from "react";
import {
	runOnJS,
	type SharedValue,
	useAnimatedReaction,
} from "react-native-reanimated";
import { getPairKeyForSource } from "../../../../../../stores/bounds/internals/links";
import type { ScreenPairKey } from "../../../../../../stores/bounds/types";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../../../types/animation.types";
import type { BoundaryLocalMeasurementValue } from "../../../../types";
import { createBoundaryPortalHostName } from "../../../utils/naming";
import {
	mountPortalBoundaryHost,
	unmountPortalBoundaryHostByName,
} from "../stores/portal-boundary-host.store";

type UseActivePortalBoundaryHostParams = {
	boundaryId: string;
	currentScreenKey: string;
	escapeHostKey?: string;
	localMeasurement: BoundaryLocalMeasurementValue;
	portalHostName: SharedValue<string | null>;
	portalHostReady: SharedValue<boolean>;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
};

export const useActivePortalBoundaryHost = ({
	boundaryId,
	currentScreenKey,
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
			const pairKey = getPairKeyForSource(boundaryId, currentScreenKey);
			const measurement = localMeasurement.get();
			if (!pairKey || measurement?.pairKey !== pairKey) {
				return null;
			}

			return pairKey;
		},
		(pairKey, previousPairKey) => {
			"worklet";
			if (pairKey === previousPairKey) {
				return;
			}

			runOnJS(updateActivePairKey)(pairKey);
		},
	);

	useLayoutEffect(() => {
		if (!activePairKey || !escapeHostKey) {
			portalHostName.set(null);
			portalHostReady.set(false);
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
			portalHostReady.set(false);
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
