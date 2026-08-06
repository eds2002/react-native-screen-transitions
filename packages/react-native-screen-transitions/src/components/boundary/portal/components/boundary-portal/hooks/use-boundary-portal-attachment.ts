import { useAnimatedProps, useSharedValue } from "react-native-reanimated";
import { useDescriptorsStore } from "../../../../../../providers/screen/descriptors";
import { useScreenSlots } from "../../../../../../providers/screen/styles";
import { useBoundaryRootStore } from "../../../../providers/boundary-root.provider";
import { PORTAL_HOST_NAME_RESET_VALUE } from "../../../utils/naming";
import { isTeleportEnabled } from "../../../utils/teleport-control";
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
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);
	const { slotsMap } = useScreenSlots();
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
			teleport,
			...slotProps
		} = slot?.props ?? {};

		const shouldAttach =
			slot !== undefined &&
			isTeleportEnabled(teleport) &&
			portalHostReady.get();

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
