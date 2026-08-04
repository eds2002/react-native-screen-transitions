const CLOSE_ACTION_REPLAY = Symbol("screen-transition-close-action-replay");

type MarkedCloseAction = {
	[CLOSE_ACTION_REPLAY]?: true;
};

export const isCloseActionReplay = (action: unknown): boolean =>
	typeof action === "object" &&
	action !== null &&
	(action as MarkedCloseAction)[CLOSE_ACTION_REPLAY] === true;

/** Carries the terminal-removal bypass through React Navigation's action clones. */
export const dispatchCloseAction = <TAction extends object>(
	action: TAction,
	dispatch: (action: TAction) => void,
) => {
	const markedAction = action as TAction & MarkedCloseAction;
	markedAction[CLOSE_ACTION_REPLAY] = true;

	try {
		dispatch(action);
	} finally {
		delete markedAction[CLOSE_ACTION_REPLAY];
	}
};
