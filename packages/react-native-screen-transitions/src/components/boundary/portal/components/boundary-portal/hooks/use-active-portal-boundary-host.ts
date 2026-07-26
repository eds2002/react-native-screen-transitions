import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { type SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import type { LocalStyleLayers } from "../../../../../../providers/screen/styles/helpers/resolve-slot-styles";
import { pairs } from "../../../../../../stores/bounds/internals/state";
import type { ScreenPairKey } from "../../../../../../stores/bounds/types";
import type { NormalizedTransitionInterpolatedStyle } from "../../../../../../types/animation.types";
import { createBoundaryPortalHostName } from "../../../utils/naming";
import { hasActiveBoundaryPortalLink } from "../helpers/active-pair";
import {
	mountPortalBoundaryHost,
	unmountPortalBoundaryHostByName,
} from "../stores/portal-boundary-host.store";

type UseActivePortalBoundaryHostParams = {
	boundaryId: string;
	currentScreenKey: string;
	escapeHostKey?: string;
	localStylesMaps: SharedValue<LocalStyleLayers>;
	portalHostName: SharedValue<string | null>;
	portalHostReady: SharedValue<boolean>;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	sourcePairKey?: ScreenPairKey;
};

export const useActivePortalBoundaryHost = ({
	boundaryId,
	currentScreenKey,
	escapeHostKey,
	localStylesMaps,
	portalHostName,
	portalHostReady,
	slotsMap,
	sourcePairKey,
}: UseActivePortalBoundaryHostParams) => {
	const [hasActiveLink, setHasActiveLink] = useState(false);
	const sourcePairKeyRef = useRef(sourcePairKey);
	sourcePairKeyRef.current = sourcePairKey;

	const updateActiveLink = useCallback(
		(
			observedSourcePairKey: ScreenPairKey | undefined,
			nextHasActiveLink: boolean,
		) => {
			if (sourcePairKeyRef.current !== observedSourcePairKey) {
				return;
			}

			setHasActiveLink(nextHasActiveLink);
		},
		[],
	);

	useAnimatedReaction(
		() => {
			"worklet";
			return hasActiveBoundaryPortalLink({
				boundaryId,
				pairsState: pairs.get(),
				sourcePairKey,
			});
		},
		(nextHasActiveLink, previousHasActiveLink) => {
			"worklet";
			if (nextHasActiveLink === previousHasActiveLink) {
				return;
			}

			scheduleOnRN(updateActiveLink, sourcePairKey, nextHasActiveLink);
		},
	);

	useLayoutEffect(() => {
		if (!hasActiveLink || !sourcePairKey || !escapeHostKey) {
			portalHostName.set(null);
			portalHostReady.set(false);
			return;
		}

		const nextPortalHostName = createBoundaryPortalHostName(
			escapeHostKey,
			boundaryId,
			sourcePairKey,
		);

		mountPortalBoundaryHost({
			boundaryId,
			hostKey: escapeHostKey,
			localStylesMaps,
			pairKey: sourcePairKey,
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
		boundaryId,
		currentScreenKey,
		escapeHostKey,
		localStylesMaps,
		portalHostName,
		portalHostReady,
		sourcePairKey,
		slotsMap,
		hasActiveLink,
	]);
};
