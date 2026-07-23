import { useLayoutEffect } from "react";
import { useAnimatedProps, useSharedValue } from "react-native-reanimated";
import { useDescriptorsStore } from "../../../../../../providers/screen/descriptors";
import { useScreenSlots } from "../../../../../../providers/screen/styles";
import { getLinkKeyFromTag } from "../../../../../../stores/bounds/helpers/link-pairs.helpers";
import { pairs } from "../../../../../../stores/bounds/internals/state";
import { PORTAL_HOST_NAME_RESET_VALUE } from "../../../utils/naming";
import { shouldAttachBoundaryPortal } from "../../../utils/teleport-control";
import { createBoundaryPortalHostName } from "../helpers/host-name";
import { useActiveHostKey } from "../stores/host-registry.store";
import {
	mountPortalBoundaryHost,
	unmountPortalBoundaryHostByName,
} from "../stores/portal-boundary-host.store";

interface UseBoundaryPortalAttachmentParams {
	boundaryId: string;
	enabled: boolean;
}

export const useBoundaryPortalAttachment = ({
	boundaryId,
	enabled,
}: UseBoundaryPortalAttachmentParams) => {
	const sourcePairKey = useDescriptorsStore((s) => s.derivations.sourcePairKey);
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);
	const { localStylesMaps, slotsMap } = useScreenSlots();
	const portalHostName = useSharedValue<string | null>(null);
	const portalHostReady = useSharedValue(false);
	const escapeHostKey = useActiveHostKey(enabled ? currentScreenKey : null);

	useLayoutEffect(() => {
		if (!enabled || !sourcePairKey || !escapeHostKey) {
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
		enabled,
		escapeHostKey,
		localStylesMaps,
		portalHostName,
		portalHostReady,
		sourcePairKey,
		slotsMap,
	]);

	const teleportProps = useAnimatedProps(() => {
		"worklet";

		const slot = slotsMap.get()[boundaryId];
		const {
			pointerEvents: _pointerEvents,
			teleport,
			...slotProps
		} = slot?.props ?? {};
		const shouldTeleport = shouldAttachBoundaryPortal({
			enabled,
			teleport,
		});
		const hostName = portalHostName.get();
		const pair = sourcePairKey ? pairs.get()[sourcePairKey] : undefined;
		const linkKey = getLinkKeyFromTag(boundaryId);
		const link = pair?.links[linkKey];
		const hasActiveLink =
			link?.source !== null &&
			link !== undefined &&
			(!link.group || pair?.groups[link.group]?.activeId === linkKey);
		const canAttach =
			shouldTeleport && hasActiveLink && portalHostReady.get() && hostName;

		return {
			...slotProps,
			hostName: canAttach ? hostName : PORTAL_HOST_NAME_RESET_VALUE,
		};
	});

	return { teleportProps };
};
