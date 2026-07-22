import { LifecycleTransitionRequestKind } from "../../../../stores/system.store";
import {
	hasOpenTransitionStarted,
	isOpenTransitionBlocked,
} from "./transition-visual-state";

type ScreenVisibilityGateState = {
	isFloatingOverlay?: boolean;
	hasVisibilityGateOpened: boolean;
	pendingLifecycleStartBlockCount: number;
	pendingLifecycleRequestKind: LifecycleTransitionRequestKind;
	animationProgress: number;
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
	animationProgress,
	entering,
}: ScreenVisibilityGateState): ScreenVisibilityGateDecision => {
	"worklet";
	if (isFloatingOverlay || hasVisibilityGateOpened) {
		return {
			shouldBlock: false,
			shouldOpenGate: false,
		};
	}

	const isPendingOpen =
		pendingLifecycleRequestKind === LifecycleTransitionRequestKind.Open;
	const isOpening = isPendingOpen || !!entering;
	const shouldBlock = isOpenTransitionBlocked({
		opening: isOpening,
		pendingLifecycleStartBlockCount,
		animationProgress,
	});

	return {
		shouldBlock,
		shouldOpenGate: !shouldBlock && hasOpenTransitionStarted(animationProgress),
	};
};
