import { useAnimatedProps, useSharedValue } from "react-native-reanimated";
import { useDescriptorsStore } from "../../../../../../providers/screen/descriptors";
import {
	useOptionalScreenSlotStore,
	useScreenSlotStore,
} from "../../../../../../providers/screen/styles";
import { hasCloseTransitionFinished } from "../../../../../../providers/screen/styles/helpers/transition-visual-state";
import { useBlankStackStore } from "../../../../../../providers/stack/blank-stack.provider";
import { AnimationStore } from "../../../../../../stores/animation.store";
import { getLinkKeyFromTag } from "../../../../../../stores/bounds/helpers/link-pairs.helpers";
import { getEntry } from "../../../../../../stores/bounds/internals/entries";
import { pairs } from "../../../../../../stores/bounds/internals/state";
import type {
	LinkPairState,
	TagLink,
} from "../../../../../../stores/bounds/types";
import { SystemStore } from "../../../../../../stores/system.store";
import { PORTAL_HOST_NAME_RESET_VALUE } from "../../../utils/naming";
import {
	resolveActiveHandoffReceiver,
	resolveHandoffAttachmentCandidate,
	resolvePreviousHandoffReceiver,
	resolveRequestedHandoffPairKey,
	resolveRequestedHandoffReceiver,
} from "../helpers/active-handoff-receiver";
import { createBoundaryContentPortalHostName } from "../helpers/host-name";

interface UseBoundaryContentPortalAttachmentParams {
	boundaryId: string;
}

const isCompleteActiveLink = (
	pair: LinkPairState | null | undefined,
	link: TagLink | undefined,
	boundaryLinkKey: string,
) => {
	"worklet";

	return (
		link?.status === "complete" &&
		(!link.group || pair?.groups[link.group]?.activeId === boundaryLinkKey)
	);
};

export const useBoundaryContentPortalAttachment = ({
	boundaryId,
}: UseBoundaryContentPortalAttachmentParams) => {
	const slotsMap = useScreenSlotStore((store) => store.slotsMap);

	const currentScreenKey = useDescriptorsStore(
		(s) => s.derivations.currentScreenKey,
	);
	const nextScreenKey = useDescriptorsStore((s) => s.derivations.nextScreenKey);
	const sourcePairKey = useDescriptorsStore((s) => s.derivations.sourcePairKey);
	const destinationPairKey = useDescriptorsStore(
		(s) => s.derivations.destinationPairKey,
	);
	const destinationSlots = useOptionalScreenSlotStore(
		nextScreenKey ?? currentScreenKey,
	);
	const unavailableInterpolatorReady = useSharedValue(0);
	const interpolatorReady =
		destinationSlots?.interpolatorReady ?? unavailableInterpolatorReady;

	const activeReceiverScreenKey = useBlankStackStore(
		resolveActiveHandoffReceiver,
	);
	const previousReceiverScreenKey = useBlankStackStore(
		resolvePreviousHandoffReceiver,
	);

	const activeReceiverAnimationProgress = SystemStore.getValue(
		activeReceiverScreenKey ?? currentScreenKey,
		"animationProgress",
	);

	const activeReceiverClosing = AnimationStore.getValue(
		activeReceiverScreenKey ?? currentScreenKey,
		"closing",
	);

	const attachedReceiverScreenKey = useSharedValue(currentScreenKey);
	const sourcePairBeforeClose = useSharedValue<string | null>(null);

	const teleportProps = useAnimatedProps(() => {
		"worklet";

		const slot = slotsMap.get()[boundaryId];
		const {
			pointerEvents: _pointerEvents,
			handoffTarget,
			...slotProps
		} = slot?.props ?? {};
		const closing = activeReceiverClosing.get();
		const animationProgress = activeReceiverAnimationProgress.get();

		if (!closing) {
			sourcePairBeforeClose.set(sourcePairKey ?? null);
		}

		const pairChangedDuringClose =
			!!closing &&
			!!sourcePairKey &&
			sourcePairKey !== sourcePairBeforeClose.get();

		const hasActiveCloseFinished = hasCloseTransitionFinished({
			closing,
			animationProgress,
		});

		const automaticPair = sourcePairKey ? pairs.get()[sourcePairKey] : null;
		const boundaryLinkKey = getLinkKeyFromTag(boundaryId);
		const automaticLink = automaticPair?.links[boundaryLinkKey];

		const pairDestination =
			automaticLink?.status === "complete" &&
			(!automaticLink.group ||
				automaticPair?.groups[automaticLink.group]?.activeId ===
					boundaryLinkKey)
				? automaticLink.destination.screenKey
				: null;
		const destinationPair = destinationPairKey
			? pairs.get()[destinationPairKey]
			: null;
		const destinationLink = destinationPair?.links[boundaryLinkKey];
		const retainedSourcePairKey = sourcePairBeforeClose.get() ?? undefined;
		const retainedSourcePair = retainedSourcePairKey
			? pairs.get()[retainedSourcePairKey]
			: null;
		const retainedSourceLink = retainedSourcePair?.links[boundaryLinkKey];
		const requestedPairKey = resolveRequestedHandoffPairKey({
			destinationPairHasCompleteLink: isCompleteActiveLink(
				destinationPair,
				destinationLink,
				boundaryLinkKey,
			),
			destinationPairKey,
			handoffTarget,
			retainedSourcePairHasCompleteLink: isCompleteActiveLink(
				retainedSourcePair,
				retainedSourceLink,
				boundaryLinkKey,
			),
			retainedSourcePairKey,
			sourcePairHasCompleteLink: isCompleteActiveLink(
				automaticPair,
				automaticLink,
				boundaryLinkKey,
			),
			sourcePairKey,
		});
		const requestedPair = requestedPairKey
			? pairs.get()[requestedPairKey]
			: null;
		const requestedLink = requestedPair?.links[boundaryLinkKey];

		const isInterpolatorReady = interpolatorReady.get();
		const attachedScreenKey = attachedReceiverScreenKey.get();

		const automaticReceiverScreenKey = resolveHandoffAttachmentCandidate({
			activeReceiverClosing: !!closing,
			activeReceiverScreenKey,
			attachedReceiverScreenKey: attachedScreenKey,
			hasActiveCloseFinished,
			interpolatorReady: !!isInterpolatorReady,
			pairChangedDuringClose,
			pairDestinationScreenKey: pairDestination,
			pairHasBoundaryLink: automaticLink !== undefined,
			previousReceiverScreenKey,
		});
		const requestedDestinationScreenKey =
			requestedLink?.status === "complete"
				? requestedLink.destination.screenKey
				: null;
		const nextReceiverScreenKey = resolveRequestedHandoffReceiver({
			automaticScreenKey: automaticReceiverScreenKey,
			destinationReady:
				requestedDestinationScreenKey === activeReceiverScreenKey ||
				!!isInterpolatorReady,
			destinationScreenKey: requestedDestinationScreenKey,
			handoffTarget,
			sourceScreenKey:
				requestedLink?.status === "complete"
					? requestedLink.source.screenKey
					: null,
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

		const canActivateReceiver =
			returningFromActiveClose ||
			activatingPairDestination ||
			animationProgress > 0;

		if (nextReceiverScreenKey && receiverReady && canActivateReceiver) {
			attachedReceiverScreenKey.set(nextReceiverScreenKey);
		}

		const targetScreenKey = attachedReceiverScreenKey.get();

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
