import { useIsFocused } from "@react-navigation/native";
import { useAnimatedProps, useSharedValue } from "react-native-reanimated";
import { useDescriptorsStore } from "../../../../../../providers/screen/descriptors";
import { useScreenSlotStore } from "../../../../../../providers/screen/styles";
import { pairs } from "../../../../../../stores/bounds/internals/state";
import { useBoundaryRootStore } from "../../../../providers/boundary-root.provider";
import { PORTAL_HOST_NAME_RESET_VALUE } from "../../../utils/naming";
import { shouldAttachBoundaryPortal } from "../helpers/attachment";
import { resolveActiveBoundaryPortalPairKey } from "../helpers/local-measurement";
import { useActiveHostKey } from "../stores/host-registry.store";
import { useActivePortalBoundaryHost } from "./use-active-portal-boundary-host";

interface UseBoundaryPortalAttachmentParams {
	boundaryId: string;
}

export const useBoundaryPortalAttachment = ({
	boundaryId,
}: UseBoundaryPortalAttachmentParams) => {
	const localMeasurement = useBoundaryRootStore((root) => {
		return root.localMeasurement;
	});
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);
	// React Navigation resolves focus through the entire parent navigator chain.
	// A leaf that is still selected in its own one-screen stack becomes unfocused
	// when any ancestor route is covered.
	const focused = useIsFocused();
	const slotsMap = useScreenSlotStore((store) => store.slotsMap);
	const portalHostName = useSharedValue<string | null>(null);
	const portalHostReady = useSharedValue<string | null>(null);
	const escapeHostKey = useActiveHostKey(currentScreenKey);

	useActivePortalBoundaryHost({
		boundaryId,
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
			teleport,
			...slotProps
		} = slot?.props ?? {};

		const activePortalHostName = portalHostName.get();
		const shouldAttach = shouldAttachBoundaryPortal({
			focused,
			portalHostReady:
				activePortalHostName !== null &&
				portalHostReady.get() === activePortalHostName,
			slotActive:
				resolveActiveBoundaryPortalPairKey(
					localMeasurement.get(),
					slot,
					boundaryId,
					pairs.get(),
				) !== null && slot !== undefined,
			teleport,
		});

		const hostName = shouldAttach
			? activePortalHostName
			: PORTAL_HOST_NAME_RESET_VALUE;

		return {
			...slotProps,
			hostName,
		};
	}, [focused]);

	return { teleportProps };
};
