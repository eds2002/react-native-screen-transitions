import type { ScreenPairKey } from "../../../../../../stores/bounds/types";
import type { BoundaryHandoffTarget } from "../../../../../../types/animation.types";

type ReceiverRoute = {
	key: string;
};

type ReceiverScene = {
	activity: string;
	route: ReceiverRoute;
};

type ResolveActiveHandoffReceiverParams = {
	focusedIndex: number;
	routes: ReceiverRoute[];
	scenes: ReceiverScene[];
};

export const resolveActiveHandoffReceiver = ({
	focusedIndex,
	routes,
	scenes,
}: ResolveActiveHandoffReceiverParams): string | null => {
	for (let index = scenes.length - 1; index >= 0; index--) {
		const scene = scenes[index];
		if (scene?.activity === "closing") {
			return scene.route.key;
		}
	}

	return routes[focusedIndex]?.key ?? null;
};

export const resolvePreviousHandoffReceiver = ({
	focusedIndex,
	routes,
	scenes,
}: ResolveActiveHandoffReceiverParams): string | null => {
	for (let index = scenes.length - 1; index >= 0; index--) {
		if (scenes[index]?.activity !== "closing") {
			continue;
		}

		for (let previousIndex = index - 1; previousIndex >= 0; previousIndex--) {
			const previousScene = scenes[previousIndex];
			if (previousScene?.activity !== "closing") {
				return previousScene?.route.key ?? null;
			}
		}
	}

	return routes[focusedIndex]?.key ?? null;
};

export const resolveHandoffAttachmentCandidate = ({
	activeReceiverClosing,
	activeReceiverScreenKey,
	attachedReceiverScreenKey,
	hasActiveCloseFinished,
	isScreenReady,
	pairChangedDuringClose = false,
	pairDestinationScreenKey,
	pairHasBoundaryLink,
	previousReceiverScreenKey,
}: {
	activeReceiverClosing: boolean;
	activeReceiverScreenKey: string | null;
	attachedReceiverScreenKey: string;
	hasActiveCloseFinished: boolean;
	isScreenReady: boolean;
	pairChangedDuringClose?: boolean;
	pairDestinationScreenKey: string | null;
	pairHasBoundaryLink?: boolean;
	previousReceiverScreenKey: string | null;
}) => {
	"worklet";
	const currentPairHasBoundaryLink =
		pairHasBoundaryLink ?? pairDestinationScreenKey !== null;

	if (
		activeReceiverClosing &&
		attachedReceiverScreenKey !== activeReceiverScreenKey &&
		!currentPairHasBoundaryLink
	) {
		return attachedReceiverScreenKey;
	}

	if (
		activeReceiverClosing &&
		isScreenReady &&
		pairDestinationScreenKey &&
		pairChangedDuringClose
	) {
		return pairDestinationScreenKey;
	}

	if (
		activeReceiverClosing &&
		pairChangedDuringClose &&
		!currentPairHasBoundaryLink
	) {
		return hasActiveCloseFinished
			? previousReceiverScreenKey
			: attachedReceiverScreenKey;
	}

	if (
		hasActiveCloseFinished &&
		attachedReceiverScreenKey === activeReceiverScreenKey
	) {
		return previousReceiverScreenKey;
	}

	if (hasActiveCloseFinished) {
		return attachedReceiverScreenKey;
	}

	if (
		activeReceiverClosing &&
		attachedReceiverScreenKey !== activeReceiverScreenKey &&
		isScreenReady &&
		pairDestinationScreenKey
	) {
		return pairDestinationScreenKey;
	}

	return activeReceiverScreenKey;
};

export const resolveRequestedHandoffReceiver = ({
	automaticScreenKey,
	destinationReady = true,
	destinationScreenKey,
	handoffTarget,
	sourceScreenKey,
}: {
	automaticScreenKey: string | null;
	destinationReady?: boolean;
	destinationScreenKey: string | null;
	handoffTarget: BoundaryHandoffTarget | undefined;
	sourceScreenKey: string | null;
}) => {
	"worklet";

	if (handoffTarget === "source") {
		return sourceScreenKey;
	}

	if (handoffTarget === "destination") {
		return destinationReady ? destinationScreenKey : automaticScreenKey;
	}

	return automaticScreenKey;
};

export const resolveRequestedHandoffPairKey = ({
	destinationPairHasCompleteLink,
	destinationPairKey,
	handoffTarget,
	retainedSourcePairHasCompleteLink,
	retainedSourcePairKey,
	sourcePairHasCompleteLink,
	sourcePairKey,
}: {
	destinationPairHasCompleteLink: boolean;
	destinationPairKey: ScreenPairKey | undefined;
	handoffTarget: BoundaryHandoffTarget | undefined;
	retainedSourcePairHasCompleteLink: boolean;
	retainedSourcePairKey: ScreenPairKey | undefined;
	sourcePairHasCompleteLink: boolean;
	sourcePairKey: ScreenPairKey | undefined;
}) => {
	"worklet";

	if (handoffTarget === "source" || handoffTarget === "destination") {
		if (sourcePairHasCompleteLink) {
			return sourcePairKey;
		}

		if (destinationPairHasCompleteLink) {
			return destinationPairKey;
		}

		if (retainedSourcePairHasCompleteLink) {
			return retainedSourcePairKey;
		}

		return sourcePairKey ?? destinationPairKey ?? retainedSourcePairKey;
	}

	return sourcePairKey;
};
