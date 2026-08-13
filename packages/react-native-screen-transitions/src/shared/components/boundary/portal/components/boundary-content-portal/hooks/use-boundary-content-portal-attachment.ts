import { useAnimatedProps, useSharedValue } from "react-native-reanimated";
import { useStack } from "../../../../../../hooks/navigation/use-stack";
import { useDescriptorsStore } from "../../../../../../providers/screen/descriptors";
import {
	useOptionalScreenSlotStore,
	useScreenSlotStore,
} from "../../../../../../providers/screen/styles";
import { hasCloseTransitionFinished } from "../../../../../../providers/screen/styles/helpers/transition-visual-state";
import { AnimationStore } from "../../../../../../stores/animation.store";
import { getLinkKeyFromTag } from "../../../../../../stores/bounds/helpers/link-pairs.helpers";
import { getEntry } from "../../../../../../stores/bounds/internals/entries";
import { pairs } from "../../../../../../stores/bounds/internals/state";
import { SystemStore } from "../../../../../../stores/system.store";
import { PORTAL_HOST_NAME_RESET_VALUE } from "../../../utils/naming";
import { isTeleportEnabled } from "../../../utils/teleport-control";
import {
	hasNestedHandoffTopology,
	resolveActiveHandoffReceiver,
	resolveHandoffAttachmentCandidate,
	resolveNestedHandoffAttachmentCandidate,
	resolvePreviousHandoffReceiver,
} from "../helpers/active-handoff-receiver";
import { createBoundaryContentPortalHostName } from "../helpers/host-name";

interface UseBoundaryContentPortalAttachmentParams {
	boundaryId: string;
}

export const useBoundaryContentPortalAttachment = ({
	boundaryId,
}: UseBoundaryContentPortalAttachmentParams) => {
	const slotsMap = useScreenSlotStore((store) => store.slotsMap);

	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);
	const nextScreenKey = useDescriptorsStore((s) => s.derivations.nextScreenKey);
	const sourcePairKey = useDescriptorsStore((s) => s.derivations.sourcePairKey);
	const transitionSourcePairKey = useDescriptorsStore(
		(s) => s.derivations.transitionSourcePairKey,
	);
	const transitionDestinationScreenKey = useDescriptorsStore(
		(s) => s.derivations.transitionDestinationScreenKey,
	);
	const isNestedSource = !sourcePairKey && !!transitionSourcePairKey;
	const resolvedSourcePairKey = sourcePairKey ?? transitionSourcePairKey;
	const resolvedDestinationScreenKey =
		nextScreenKey ?? transitionDestinationScreenKey;
	const destinationSlots = useOptionalScreenSlotStore(
		resolvedDestinationScreenKey ?? currentScreenKey,
	);
	const unavailableInterpolatorReady = useSharedValue(0);
	const interpolatorReady =
		destinationSlots?.interpolatorReady ?? unavailableInterpolatorReady;

	const activeReceiverScreenKey = useStack(resolveActiveHandoffReceiver);
	const previousReceiverScreenKey = useStack(resolvePreviousHandoffReceiver);

	const activeReceiverAnimationProgress = SystemStore.getValue(
		activeReceiverScreenKey ?? currentScreenKey,
		"animationProgress",
	);

	const activeReceiverClosing = AnimationStore.getValue(
		activeReceiverScreenKey ?? currentScreenKey,
		"closing",
	);
	const nestedDestinationAnimationProgress = SystemStore.getValue(
		isNestedSource && resolvedDestinationScreenKey
			? resolvedDestinationScreenKey
			: currentScreenKey,
		"animationProgress",
	);
	const nestedDestinationClosing = AnimationStore.getValue(
		isNestedSource && resolvedDestinationScreenKey
			? resolvedDestinationScreenKey
			: currentScreenKey,
		"closing",
	);

	const attachedReceiverScreenKey = useSharedValue(currentScreenKey);
	const sourcePairBeforeClose = useSharedValue<string | null>(null);

	const teleportProps = useAnimatedProps(() => {
		"worklet";

		const slot = slotsMap.get()[boundaryId];
		const {
			pointerEvents: _pointerEvents,
			teleport,
			...slotProps
		} = slot?.props ?? {};

		const shouldTeleport = isTeleportEnabled(teleport);
		const closing = isNestedSource
			? nestedDestinationClosing.get()
			: activeReceiverClosing.get();
		const animationProgress = isNestedSource
			? nestedDestinationAnimationProgress.get()
			: activeReceiverAnimationProgress.get();

		if (!closing) {
			sourcePairBeforeClose.set(resolvedSourcePairKey ?? null);
		}

		const pairChangedDuringClose =
			!!closing &&
			!!resolvedSourcePairKey &&
			resolvedSourcePairKey !== sourcePairBeforeClose.get();

		const hasActiveCloseFinished = hasCloseTransitionFinished({
			closing,
			animationProgress,
		});

		const pair = resolvedSourcePairKey
			? pairs.get()[resolvedSourcePairKey]
			: null;
		const link = pair?.links[getLinkKeyFromTag(boundaryId)];

		const pairDestination =
			link?.status === "complete" &&
			(!link.group ||
				pair?.groups[link.group]?.activeId === getLinkKeyFromTag(boundaryId))
				? link.destination.screenKey
				: null;

		const isInterpolatorReady = interpolatorReady.get();
		const attachedScreenKey = attachedReceiverScreenKey.get();
		const usesNestedReceiver = hasNestedHandoffTopology({
			inheritedSourcePair: isNestedSource,
			pairDestinationScreenKey: pairDestination,
			transitionDestinationScreenKey: resolvedDestinationScreenKey,
		});

		const nextReceiverScreenKey = usesNestedReceiver
			? resolveNestedHandoffAttachmentCandidate({
					attachedReceiverScreenKey: attachedScreenKey,
					currentScreenKey,
					hasActiveCloseFinished,
					interpolatorReady: !!isInterpolatorReady,
					pairDestinationScreenKey: pairDestination,
				})
			: resolveHandoffAttachmentCandidate({
					activeReceiverClosing: !!closing,
					activeReceiverScreenKey,
					attachedReceiverScreenKey: attachedScreenKey,
					hasActiveCloseFinished,
					interpolatorReady: !!isInterpolatorReady,
					pairChangedDuringClose,
					pairDestinationScreenKey: pairDestination,
					previousReceiverScreenKey,
				});

		const receiverEntry = nextReceiverScreenKey
			? getEntry(boundaryId, nextReceiverScreenKey)
			: null;

		const receiverReady = receiverEntry?.handoff === true;

		const returningFromActiveClose =
			hasActiveCloseFinished && attachedScreenKey === activeReceiverScreenKey;

		const activatingPairDestination =
			!!pairDestination &&
			!!isInterpolatorReady &&
			nextReceiverScreenKey === pairDestination;

		const canActivateReceiver = usesNestedReceiver
			? nextReceiverScreenKey === attachedScreenKey ||
				hasActiveCloseFinished ||
				activatingPairDestination
			: returningFromActiveClose ||
				activatingPairDestination ||
				animationProgress > 0;

		if (nextReceiverScreenKey && receiverReady && canActivateReceiver) {
			attachedReceiverScreenKey.set(nextReceiverScreenKey);
		}

		const targetScreenKey = shouldTeleport
			? attachedReceiverScreenKey.get()
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
