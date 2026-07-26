import {
	type SharedValue,
	useAnimatedProps,
	useSharedValue,
} from "react-native-reanimated";
import { useDescriptorsStore } from "../../../../../../providers/screen/descriptors";
import { useScreenSlots } from "../../../../../../providers/screen/styles";
import { hasCloseTransitionFinished } from "../../../../../../providers/screen/styles/helpers/transition-visual-state";
import { AnimationStore } from "../../../../../../stores/animation.store";
import { pairs } from "../../../../../../stores/bounds/internals/state";
import { SystemStore } from "../../../../../../stores/system.store";
import { PORTAL_HOST_NAME_RESET_VALUE } from "../../../utils/naming";
import { isTeleportEnabled } from "../../../utils/teleport-control";
import { hasActiveBoundaryPortalLink } from "../helpers/active-pair";
import { useActiveHostKey } from "../stores/host-registry.store";
import { useActivePortalBoundaryHost } from "./use-active-portal-boundary-host";

interface UseBoundaryPortalAttachmentParams {
	boundaryId: string;
}

type AttachedDestination = {
	animationProgress: SharedValue<number>;
	closing: SharedValue<number>;
};

export const useBoundaryPortalAttachment = ({
	boundaryId,
}: UseBoundaryPortalAttachmentParams) => {
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
	const destinationClosing = AnimationStore.getValue(
		destinationScreenKey,
		"closing",
	);
	const { localStylesMaps, slotsMap } = useScreenSlots();
	const portalHostName = useSharedValue<string | null>(null);
	const portalHostReady = useSharedValue(false);
	const attachedDestination = useSharedValue<AttachedDestination | null>(null);
	const escapeHostKey = useActiveHostKey(currentScreenKey);

	useActivePortalBoundaryHost({
		boundaryId,
		currentScreenKey,
		escapeHostKey,
		localStylesMaps,
		portalHostName,
		portalHostReady,
		sourcePairKey,
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
		const shouldTeleport = isTeleportEnabled(teleport);
		const hostName = portalHostName.get();
		const hasActiveLink = hasActiveBoundaryPortalLink({
			boundaryId,
			pairsState: pairs.get(),
			sourcePairKey,
		});
		const hasAttachableHost =
			shouldTeleport && hasActiveLink && portalHostReady.get() && hostName;

		if (hasAttachableHost) {
			attachedDestination.set({
				animationProgress: destinationAnimationProgress,
				closing: destinationClosing,
			});
		}

		const attached = attachedDestination.get();
		const hasAttachedCloseFinished =
			attached !== null &&
			hasCloseTransitionFinished({
				animationProgress: attached.animationProgress.get(),
				closing: attached.closing.get(),
			});
		const canAttach = hasAttachableHost && !hasAttachedCloseFinished;
		const targetHostName = canAttach ? hostName : PORTAL_HOST_NAME_RESET_VALUE;

		return {
			...slotProps,
			hostName: targetHostName,
		};
	});

	return { teleportProps };
};
