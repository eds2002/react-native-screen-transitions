import { useAnimatedProps, useSharedValue } from "react-native-reanimated";
import { useBuilderStore } from "../../../../../../providers/screen/builder";
import {
	useMotionStore,
	useOptionalMotionStore,
} from "../../../../../../providers/screen/motion";
import { hasCloseTransitionFinished } from "../../../../../../providers/screen/motion/helpers/transition-visual-state";
import { useOrchestratorStore } from "../../../../../../providers/screen/orchestrator";
import { useBlankStackStore } from "../../../../../../providers/stack/blank-stack.provider";
import { getLinkKeyFromTag } from "../../../../../../stores/bounds/helpers/link-pairs.helpers";
import { getEntry } from "../../../../../../stores/bounds/internals/entries";
import {
	getPairKeyForDestination,
	getPairKeyForSource,
} from "../../../../../../stores/bounds/internals/links";
import { pairs } from "../../../../../../stores/bounds/internals/state";
import type {
	LinkPairState,
	TagLink,
} from "../../../../../../stores/bounds/types";
import { PORTAL_HOST_NAME_RESET_VALUE } from "../../../utils/naming";
import {
	resolveActiveHandoffReceiver,
	resolveHandoffAttachmentCandidate,
	resolvePreviousHandoffReceiver,
	resolveRequestedHandoffPairKey,
	resolveRequestedHandoffReceiver,
} from "../helpers/active-handoff-receiver";
import { canActivateHandoffReceiver } from "../helpers/handoff-visibility";
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
	const slotsMap = useOrchestratorStore((store) => store.slotsMap);

	const currentScreenKey = useBuilderStore(
		(s) => s.derivations.currentScreenKey,
	);
	const nextScreenKey = useBuilderStore((s) => s.derivations.nextScreenKey);
	const sourcePairKey = useBuilderStore((s) => s.derivations.sourcePairKey);
	const destinationPairKey = useBuilderStore(
		(s) => s.derivations.destinationPairKey,
	);
	const destinationIsScreenReady = useOptionalMotionStore(
		nextScreenKey ?? currentScreenKey,
		(store) => store.isScreenReady,
	);
	const unavailableIsScreenReady = useSharedValue(false);
	const screenReadiness = destinationIsScreenReady ?? unavailableIsScreenReady;

	const activeReceiverScreenKey = useBlankStackStore(
		resolveActiveHandoffReceiver,
	);
	const previousReceiverScreenKey = useBlankStackStore(
		resolvePreviousHandoffReceiver,
	);

	const localAnimationProgress = useMotionStore(
		(store) => store.state.animationProgress,
	);
	const receiverAnimationProgress = useOptionalMotionStore(
		activeReceiverScreenKey ?? currentScreenKey,
		(store) => store.state.animationProgress,
	);
	const activeReceiverAnimationProgress =
		receiverAnimationProgress ?? localAnimationProgress;

	const activeReceiverClosing = useOptionalMotionStore(
		activeReceiverScreenKey ?? currentScreenKey,
		(store) => store.state.closing,
	);

	const activeReceiverIsScreenReady = useOptionalMotionStore(
		activeReceiverScreenKey ?? currentScreenKey,
		(store) => store.isScreenReady,
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
		const closing = activeReceiverClosing?.get() ?? 0;
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
		const requestedSourcePairKey =
			getPairKeyForSource(boundaryId, currentScreenKey) ?? sourcePairKey;
		const requestedSourcePair = requestedSourcePairKey
			? pairs.get()[requestedSourcePairKey]
			: null;
		const requestedSourceLink = requestedSourcePair?.links[boundaryLinkKey];

		const pairDestination =
			automaticLink?.status === "complete" &&
			(!automaticLink.group ||
				automaticPair?.groups[automaticLink.group]?.activeId ===
					boundaryLinkKey)
				? automaticLink.destination.screenKey
				: null;
		const requestedDestinationPairKey =
			getPairKeyForDestination(boundaryId, currentScreenKey) ??
			destinationPairKey;
		const destinationPair = requestedDestinationPairKey
			? pairs.get()[requestedDestinationPairKey]
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
			destinationPairKey: requestedDestinationPairKey,
			handoffTarget,
			retainedSourcePairHasCompleteLink: isCompleteActiveLink(
				retainedSourcePair,
				retainedSourceLink,
				boundaryLinkKey,
			),
			retainedSourcePairKey,
			sourcePairHasCompleteLink: isCompleteActiveLink(
				requestedSourcePair,
				requestedSourceLink,
				boundaryLinkKey,
			),
			sourcePairKey: requestedSourcePairKey,
		});
		const requestedPair = requestedPairKey
			? pairs.get()[requestedPairKey]
			: null;
		const requestedLink = requestedPair?.links[boundaryLinkKey];

		const isScreenReady = screenReadiness.get();
		const attachedScreenKey = attachedReceiverScreenKey.get();

		const automaticReceiverScreenKey = resolveHandoffAttachmentCandidate({
			activeReceiverClosing: !!closing,
			activeReceiverScreenKey,
			attachedReceiverScreenKey: attachedScreenKey,
			hasActiveCloseFinished,
			isScreenReady,
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
				isScreenReady,
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
			isScreenReady &&
			nextReceiverScreenKey === pairDestination;

		const canActivateReceiver = canActivateHandoffReceiver({
			returningFromActiveClose,
			activatingPairDestination,
			animationProgress,
			receiverIsActiveDestination:
				!returningFromActiveClose &&
				nextReceiverScreenKey === activeReceiverScreenKey,
			destinationIsScreenReady: activeReceiverIsScreenReady?.get(),
		});

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
