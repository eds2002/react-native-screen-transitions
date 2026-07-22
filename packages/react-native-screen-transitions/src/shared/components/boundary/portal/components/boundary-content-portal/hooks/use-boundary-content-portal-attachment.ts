import { useAnimatedProps, useSharedValue } from "react-native-reanimated";
import { useDescriptorsStore } from "../../../../../../providers/screen/descriptors";
import { useScreenSlots } from "../../../../../../providers/screen/styles";
import { pairs } from "../../../../../../stores/bounds/internals/state";
import { SystemStore } from "../../../../../../stores/system.store";
import { resolveEnteringHandoffTarget } from "../../../utils/handoff-target";
import { PORTAL_HOST_NAME_RESET_VALUE } from "../../../utils/naming";
import { shouldAttachBoundaryPortal } from "../../../utils/teleport-control";
import { createBoundaryContentPortalHostName } from "../helpers/host-name";

interface UseBoundaryContentPortalAttachmentParams {
	boundaryId: string;
	enabled: boolean;
}

export const useBoundaryContentPortalAttachment = ({
	boundaryId,
	enabled,
}: UseBoundaryContentPortalAttachmentParams) => {
	const { slotsMap } = useScreenSlots();
	const sourcePairKey = useDescriptorsStore((s) => s.derivations.sourcePairKey);
	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);
	const nextScreenKey = useDescriptorsStore((s) => s.derivations.nextScreenKey);
	const destinationScreenKey = nextScreenKey ?? currentScreenKey;
	const destinationAnimationProgress = SystemStore.getValue(
		destinationScreenKey,
		"animationProgress",
	);
	const attachedScreenKey = useSharedValue<string | null>(null);

	const teleportProps = useAnimatedProps(() => {
		"worklet";

		const slot = slotsMap.get()[boundaryId];
		const {
			pointerEvents: _pointerEvents,
			teleport,
			...slotProps
		} = slot?.props ?? {};

		const animationProgress = destinationAnimationProgress.get();
		const shouldTeleport = shouldAttachBoundaryPortal({ enabled, teleport });
		const pairsState = pairs.get();

		const enteringTargetScreenKey = shouldTeleport
			? resolveEnteringHandoffTarget({
					animationProgress,
					boundaryId,
					currentScreenKey,
					pairsState,
					sourcePairKey,
				})
			: null;

		const targetScreenKey = enteringTargetScreenKey
			? enteringTargetScreenKey
			: shouldTeleport
				? attachedScreenKey.get()
				: null;
		const targetHostName = targetScreenKey
			? createBoundaryContentPortalHostName(targetScreenKey, boundaryId)
			: PORTAL_HOST_NAME_RESET_VALUE;
		const hostName = targetHostName;
		attachedScreenKey.set(targetScreenKey);

		return {
			...slotProps,
			hostName,
		};
	});

	return { teleportProps };
};
