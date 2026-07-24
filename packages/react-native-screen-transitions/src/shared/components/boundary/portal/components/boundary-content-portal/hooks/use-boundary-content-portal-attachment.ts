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
import { resolveEnteringHandoffTarget } from "../../../utils/handoff-target";
import { PORTAL_HOST_NAME_RESET_VALUE } from "../../../utils/naming";
import { isTeleportEnabled } from "../../../utils/teleport-control";
import { createBoundaryContentPortalHostName } from "../helpers/host-name";

interface UseBoundaryContentPortalAttachmentParams {
	boundaryId: string;
}

type AttachedDestination = {
	animationProgress: SharedValue<number>;
	closing: SharedValue<number>;
	screenKey: string;
};

export const useBoundaryContentPortalAttachment = ({
	boundaryId,
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
	const destinationClosing = AnimationStore.getValue(
		destinationScreenKey,
		"closing",
	);

	// `nextScreenKey` can change while the previously attached destination is
	// still closing. Retain that destination's lifecycle shared values so this
	// payload follows the screen that actually hosts it, not the newest route.
	const attachedDestination = useSharedValue<AttachedDestination | null>(null);

	const teleportProps = useAnimatedProps(() => {
		"worklet";

		const slot = slotsMap.get()[boundaryId];
		const {
			pointerEvents: _pointerEvents,
			teleport,
			...slotProps
		} = slot?.props ?? {};

		const animationProgress = destinationAnimationProgress.get();
		const shouldTeleport = isTeleportEnabled(teleport);
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

		if (enteringTargetScreenKey) {
			// A valid entering pair is the only event that replaces the current
			// attachment and its lifecycle owner.
			attachedDestination.set({
				animationProgress: destinationAnimationProgress,
				closing: destinationClosing,
				screenKey: enteringTargetScreenKey,
			});
		}

		const attached = attachedDestination.get();
		const hasAttachedCloseFinished =
			attached !== null &&
			hasCloseTransitionFinished({
				animationProgress: attached.animationProgress.get(),
				closing: attached.closing.get(),
			});

		// Missing or changing pairs do not imply a return: keep the current host
		// until its own screen visually closes. At that point, target the source
		// host explicitly instead of `null` so Teleport restores source dimensions.
		const targetScreenKey = enteringTargetScreenKey
			? enteringTargetScreenKey
			: shouldTeleport
				? hasAttachedCloseFinished
					? currentScreenKey
					: (attached?.screenKey ?? null)
				: null;

		const targetHostName = targetScreenKey
			? createBoundaryContentPortalHostName(targetScreenKey, boundaryId)
			: PORTAL_HOST_NAME_RESET_VALUE;

		return {
			...slotProps,
			hostName: targetHostName,
		};
	});

	return { teleportProps };
};
