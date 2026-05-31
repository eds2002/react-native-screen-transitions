import { LifecycleTransitionRequestKind } from "../../../../stores/system.store";

type ScreenVisibilityGateState = {
	isFloatingOverlay?: boolean;
	hasVisibilityGateOpened: boolean;
	pendingLifecycleStartBlockCount: number;
	pendingLifecycleRequestKind: LifecycleTransitionRequestKind;
	progress: number;
	entering: number;
};

type ScreenVisibilityGateDecision = {
	shouldBlock: boolean;
	shouldOpenGate: boolean;
};

export const resolveScreenVisibilityGate = ({
	isFloatingOverlay,
	hasVisibilityGateOpened,
	pendingLifecycleStartBlockCount,
	pendingLifecycleRequestKind,
	progress,
	entering,
}: ScreenVisibilityGateState): ScreenVisibilityGateDecision => {
	"worklet";
	if (isFloatingOverlay || hasVisibilityGateOpened) {
		return {
			shouldBlock: false,
			shouldOpenGate: false,
		};
	}

	const hasPendingLifecycleBlock = pendingLifecycleStartBlockCount > 0;
	const isPendingOpen =
		pendingLifecycleRequestKind === LifecycleTransitionRequestKind.Open;
	const isOpening = isPendingOpen || !!entering;

	// Keep the screen hidden until the first transformed opening frame exists.
	// The lifecycle request is cleared before the RAF-scheduled progress
	// animation starts, so `entering` carries the gate through that one-frame gap.
	const isWaitingForOpenToStart = progress <= 0;

	const shouldBlock =
		(hasPendingLifecycleBlock || isWaitingForOpenToStart) && isOpening;

	return {
		shouldBlock,
		shouldOpenGate: !shouldBlock && progress > 0,
	};
};

export const shouldBlockScreenVisibility = (
	state: ScreenVisibilityGateState,
) => {
	"worklet";
	return resolveScreenVisibilityGate(state).shouldBlock;
};
