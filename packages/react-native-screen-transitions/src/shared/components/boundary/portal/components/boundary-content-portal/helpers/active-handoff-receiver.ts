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
	interpolatorReady,
	pairChangedDuringClose = false,
	pairDestinationScreenKey,
	previousReceiverScreenKey,
}: {
	activeReceiverClosing: boolean;
	activeReceiverScreenKey: string | null;
	attachedReceiverScreenKey: string;
	hasActiveCloseFinished: boolean;
	interpolatorReady: boolean;
	pairChangedDuringClose?: boolean;
	pairDestinationScreenKey: string | null;
	previousReceiverScreenKey: string | null;
}) => {
	"worklet";

	if (
		activeReceiverClosing &&
		interpolatorReady &&
		pairDestinationScreenKey &&
		pairChangedDuringClose
	) {
		return pairDestinationScreenKey;
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
		interpolatorReady &&
		pairDestinationScreenKey
	) {
		return pairDestinationScreenKey;
	}

	return activeReceiverScreenKey;
};
