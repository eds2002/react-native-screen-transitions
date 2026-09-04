import { EPSILON } from "../../../constants";
import type { BlankStackStoreValue } from "../../../types/providers/blank-stack-provider.types";
import type { SnapPoint } from "../../../types/screen.types";

export type StackTransitionDirection = "forward" | "backward";

export type StackTransitionSelection = {
	direction: StackTransitionDirection;
	driverRouteKey: string;
	sourceRouteKey: string;
	targetRouteKey: string;
};

export type StackTransitionStateSnapshot = {
	focusedIndex: number;
	scenes: BlankStackStoreValue["scenes"];
};

export type StackTransitionControllerSnapshot = {
	selection: StackTransitionSelection | null;
};

export enum StackTransitionDriverSignal {
	Idle = 0,
	Forward = 1,
	Backward = 2,
}

export type StackTransitionDriverFrame = {
	closing: number;
	dismissalBoundary: number;
	dismissing: number;
	dragging: number;
	entering: number;
	progressBaseline: number;
	progressSettled: number;
	settling: number;
	targetProgress: number;
	visualProgress: number;
};

export type StackTransitionController = {
	getSnapshot: () => StackTransitionControllerSnapshot;
	handleDriverSignal: (signal: StackTransitionDriverSignal) => void;
	subscribe: (listener: () => void) => () => void;
	update: (snapshot: StackTransitionStateSnapshot) => void;
};

const getFocusedScene = (snapshot: StackTransitionStateSnapshot) =>
	snapshot.scenes[snapshot.focusedIndex];

const findScene = (
	snapshot: StackTransitionStateSnapshot,
	routeKey: string | undefined,
) =>
	routeKey
		? snapshot.scenes.find((scene) => scene.route.key === routeKey)
		: undefined;

const createForwardSelection = (
	snapshot: StackTransitionStateSnapshot,
): StackTransitionSelection | null => {
	const target = getFocusedScene(snapshot);
	const source = findScene(snapshot, target?.previousDescriptor?.route.key);

	if (!source || !target || target.activity !== "active") {
		return null;
	}

	return {
		direction: "forward",
		driverRouteKey: target.route.key,
		sourceRouteKey: source.route.key,
		targetRouteKey: target.route.key,
	};
};

const createBackwardSelection = (
	snapshot: StackTransitionStateSnapshot,
): StackTransitionSelection | null => {
	const focused = getFocusedScene(snapshot);
	const focusedPrevious = findScene(
		snapshot,
		focused?.previousDescriptor?.route.key,
	);

	if (focused?.activity === "active" && focusedPrevious) {
		return {
			direction: "backward",
			driverRouteKey: focused.route.key,
			sourceRouteKey: focused.route.key,
			targetRouteKey: focusedPrevious.route.key,
		};
	}

	const focusedRouteKey = focused?.route.key;
	const closing = [...snapshot.scenes].reverse().find((scene) => {
		if (scene.activity !== "closing") return false;
		if (!focusedRouteKey) return true;

		return scene.previousDescriptor?.route.key === focusedRouteKey;
	});
	const fallbackClosing =
		closing ??
		[...snapshot.scenes]
			.reverse()
			.find((scene) => scene.activity === "closing");
	const target = findScene(
		snapshot,
		fallbackClosing?.previousDescriptor?.route.key,
	);

	if (!fallbackClosing || !target) {
		return null;
	}

	return {
		direction: "backward",
		driverRouteKey: fallbackClosing.route.key,
		sourceRouteKey: fallbackClosing.route.key,
		targetRouteKey: target.route.key,
	};
};

const createFocusChangeSelection = (
	previous: StackTransitionStateSnapshot,
	next: StackTransitionStateSnapshot,
): StackTransitionSelection | null => {
	const previousFocused = getFocusedScene(previous);
	const nextFocused = getFocusedScene(next);

	if (
		!previousFocused ||
		!nextFocused ||
		previousFocused.route.key === nextFocused.route.key
	) {
		return null;
	}

	const targetExisted = previous.scenes.some(
		(scene) => scene.route.key === nextFocused.route.key,
	);

	if (targetExisted) {
		return {
			direction: "backward",
			driverRouteKey: previousFocused.route.key,
			sourceRouteKey: previousFocused.route.key,
			targetRouteKey: nextFocused.route.key,
		};
	}

	return {
		direction: "forward",
		driverRouteKey: nextFocused.route.key,
		sourceRouteKey: previousFocused.route.key,
		targetRouteKey: nextFocused.route.key,
	};
};

const areSelectionsEqual = (
	left: StackTransitionSelection | null,
	right: StackTransitionSelection | null,
) =>
	left === right ||
	(left !== null &&
		right !== null &&
		left.direction === right.direction &&
		left.driverRouteKey === right.driverRouteKey &&
		left.sourceRouteKey === right.sourceRouteKey &&
		left.targetRouteKey === right.targetRouteKey);

export const normalizeStackTransitionProgress = (
	direction: StackTransitionDirection,
	driverProgress: number,
	dismissalBoundary: number,
) => {
	"worklet";

	const normalizedDriverProgress = Math.min(
		1,
		Math.max(0, driverProgress / Math.max(EPSILON, dismissalBoundary)),
	);

	return direction === "forward"
		? normalizedDriverProgress
		: 1 - normalizedDriverProgress;
};

export const resolveStackTransitionDismissalBoundary = ({
	progressBaseline,
	resolvedAutoSnapPoint,
	snapPoints,
}: {
	progressBaseline: number;
	resolvedAutoSnapPoint: number;
	snapPoints: SnapPoint[] | undefined;
}) => {
	"worklet";

	if (!snapPoints?.length) return progressBaseline;

	let boundary = Number.POSITIVE_INFINITY;
	for (let index = 0; index < snapPoints.length; index++) {
		const snapPoint = snapPoints[index];
		const resolvedSnapPoint =
			snapPoint === "auto" ? resolvedAutoSnapPoint : snapPoint;

		if (
			Number.isFinite(resolvedSnapPoint) &&
			resolvedSnapPoint > EPSILON &&
			resolvedSnapPoint < boundary
		) {
			boundary = resolvedSnapPoint;
		}
	}

	return Number.isFinite(boundary) ? boundary : progressBaseline;
};

export const resolveStackTransitionDriverSignal = ({
	closing,
	dismissalBoundary,
	dismissing,
	dragging,
	entering,
	progressBaseline,
	progressSettled,
	settling,
	targetProgress,
	visualProgress,
}: StackTransitionDriverFrame): StackTransitionDriverSignal => {
	"worklet";

	if (closing || dismissing || (!progressSettled && targetProgress === 0)) {
		return StackTransitionDriverSignal.Backward;
	}

	if (entering) {
		return StackTransitionDriverSignal.Forward;
	}

	if (
		(dragging || settling) &&
		visualProgress < Math.min(progressBaseline, dismissalBoundary) - EPSILON
	) {
		return StackTransitionDriverSignal.Backward;
	}

	return StackTransitionDriverSignal.Idle;
};

export const createStackTransitionController = (
	initialState: StackTransitionStateSnapshot,
): StackTransitionController => {
	let state = initialState;
	let driverActivated = false;
	let snapshot: StackTransitionControllerSnapshot = { selection: null };
	const listeners = new Set<() => void>();

	const setSelection = (
		selection: StackTransitionSelection | null,
		notify: boolean,
	) => {
		if (areSelectionsEqual(snapshot.selection, selection)) return false;

		snapshot = { selection };
		driverActivated = false;
		if (notify) {
			for (const listener of listeners) listener();
		}
		return true;
	};

	const update = (nextState: StackTransitionStateSnapshot) => {
		const focusChange = createFocusChangeSelection(state, nextState);
		state = nextState;

		if (focusChange) {
			setSelection(focusChange, false);
			return;
		}

		const selection = snapshot.selection;
		if (
			selection &&
			!nextState.scenes.some(
				(scene) => scene.route.key === selection.driverRouteKey,
			)
		) {
			setSelection(null, false);
			return;
		}

		if (!selection) {
			const closingSelection = createBackwardSelection(nextState);
			if (
				closingSelection &&
				findScene(nextState, closingSelection.driverRouteKey)?.activity ===
					"closing"
			) {
				setSelection(closingSelection, false);
			}
		}
	};

	const handleDriverSignal = (signal: StackTransitionDriverSignal) => {
		if (signal === StackTransitionDriverSignal.Idle) {
			if (driverActivated) setSelection(null, true);
			return;
		}

		const direction =
			signal === StackTransitionDriverSignal.Forward ? "forward" : "backward";
		const currentSelection = snapshot.selection;

		if (currentSelection?.direction === direction) {
			driverActivated = true;
			return;
		}

		const selection =
			direction === "forward"
				? createForwardSelection(state)
				: createBackwardSelection(state);
		if (!selection) return;

		setSelection(selection, true);
		driverActivated = true;
	};

	return {
		getSnapshot: () => snapshot,
		handleDriverSignal,
		subscribe: (listener) => {
			listeners.add(listener);
			return () => listeners.delete(listener);
		},
		update,
	};
};
