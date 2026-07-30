import { useCallback, useLayoutEffect, useRef, useState } from "react";
import {
	runOnJS,
	type SharedValue,
	useAnimatedReaction,
} from "react-native-reanimated";
import { getPairKeyForSource } from "../../../../../../stores/bounds/internals/links";
import type { ScreenPairKey } from "../../../../../../stores/bounds/types";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../../../types/animation.types";
import { createBoundaryPortalHostName } from "../../../utils/naming";
import {
	mountPortalBoundaryHost,
	unmountPortalBoundaryHostByName,
} from "../stores/portal-boundary-host.store";

type UseActivePortalBoundaryHostParams = {
	boundaryId: string;
	currentScreenKey: string;
	escapeHostKey?: string;
	portalHostName: SharedValue<string | null>;
	portalHostReady: SharedValue<boolean>;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
};

type ActivePortal = {
	pairKey: ScreenPairKey;
};

export const useActivePortalBoundaryHost = ({
	boundaryId,
	currentScreenKey,
	escapeHostKey,
	portalHostName,
	portalHostReady,
	slotsMap,
}: UseActivePortalBoundaryHostParams) => {
	const [activePortal, setActivePortal] = useState<ActivePortal | null>(null);
	const activePairKeyRef = useRef<ScreenPairKey | null>(null);

	const updateActivePortal = useCallback((pairKey: ScreenPairKey | null) => {
		if (activePairKeyRef.current === pairKey) {
			return;
		}

		activePairKeyRef.current = pairKey;
		setActivePortal(pairKey ? { pairKey } : null);
	}, []);

	useAnimatedReaction(
		() => {
			"worklet";
			const isBoundaryAnimating = slotsMap.get()[boundaryId] !== undefined;
			if (!isBoundaryAnimating) {
				return null;
			}

			return getPairKeyForSource(boundaryId, currentScreenKey);
		},
		(pairKey, previousPairKey) => {
			"worklet";
			if (pairKey === previousPairKey) {
				return;
			}

			runOnJS(updateActivePortal)(pairKey);
		},
	);

	useLayoutEffect(() => {
		if (!activePortal || !escapeHostKey) {
			portalHostName.set(null);
			portalHostReady.set(false);
			return;
		}

		const nextPortalHostName = createBoundaryPortalHostName(
			escapeHostKey,
			boundaryId,
			activePortal.pairKey,
		);

		mountPortalBoundaryHost({
			boundaryId,
			hostKey: escapeHostKey,
			pairKey: activePortal.pairKey,
			portalHostName: nextPortalHostName,
			portalHostReady,
			screenKey: currentScreenKey,
			slotsMap,
		});
		portalHostName.set(nextPortalHostName);

		return () => {
			portalHostName.set(null);
			portalHostReady.set(false);
			unmountPortalBoundaryHostByName(nextPortalHostName);
		};
	}, [
		activePortal,
		boundaryId,
		currentScreenKey,
		escapeHostKey,
		portalHostName,
		portalHostReady,
		slotsMap,
	]);
};
