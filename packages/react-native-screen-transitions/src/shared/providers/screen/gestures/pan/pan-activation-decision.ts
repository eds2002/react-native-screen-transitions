import type { GestureTouchEvent } from "react-native-gesture-handler";
import { EPSILON } from "../../../../constants";
import {
	GestureActivationState,
	type ScrollGestureState,
} from "../../../../types/gesture.types";
import type { Direction } from "../../../../types/ownership.types";
import { shouldDeferToChildClaim } from "../ownership/resolve-ownership";
import { getPanSnapAxisConfigForDirection } from "../shared/directions";
import { resolveRuntimeSnapPoints } from "../shared/snap-points";
import type {
	DirectionClaimMap,
	GestureDimensions,
	PanGestureRuntime,
} from "../types";
import {
	checkScrollBoundary,
	resolveOffsetRules,
} from "./pan-activation-rules";

export type PanActivationAction = "activate" | "fail" | "wait";

export type PanActivationReason =
	| "ancestor-dismissing"
	| "already-dragging"
	| "child-claim"
	| "disabled"
	| "dismissing"
	| "multi-touch"
	| "no-direction"
	| "offset-failed"
	| "ownership"
	| "ready"
	| "scroll-boundary"
	| "scroll-collapse-only"
	| "scroll-max-expanded"
	| "snap-locked"
	| "threshold-pending";

export interface PanActivationDecision {
	action: PanActivationAction;
	reason: PanActivationReason;
	direction: Direction | null;
	nextActivationState: GestureActivationState;
}

interface ResolvePanActivationMoveDecisionProps {
	event: GestureTouchEvent;
	runtime: PanGestureRuntime;
	dimensions: GestureDimensions;
	initialTouch: { x: number; y: number };
	activationState: GestureActivationState;
	ancestorDismissing: boolean;
	childDirectionClaims: DirectionClaimMap;
	currentScreenKey: string;
	scrollState: ScrollGestureState | null;
}

type OffsetRuleResult = ReturnType<typeof resolveOffsetRules>;
type ActiveSnapAxis = ReturnType<typeof getPanSnapAxisConfigForDirection>;

const createDecision = (
	action: PanActivationAction,
	reason: PanActivationReason,
	direction: Direction | null,
	nextActivationState: GestureActivationState,
): PanActivationDecision => {
	"worklet";
	return {
		action,
		reason,
		direction,
		nextActivationState,
	};
};

const getSwipeDirection = ({
	isSwipingDown,
	isSwipingUp,
	isSwipingRight,
	isSwipingLeft,
}: {
	isSwipingDown: boolean;
	isSwipingUp: boolean;
	isSwipingRight: boolean;
	isSwipingLeft: boolean;
}): Direction | null => {
	"worklet";
	if (isSwipingDown) return "vertical";
	if (isSwipingUp) return "vertical-inverted";
	if (isSwipingRight) return "horizontal";
	if (isSwipingLeft) return "horizontal-inverted";
	return null;
};

const resolvePreflightDecision = (
	event: GestureTouchEvent,
	runtime: PanGestureRuntime,
	ancestorDismissing: boolean,
): PanActivationDecision | null => {
	"worklet";
	if (event.numberOfTouches !== 1) {
		return createDecision(
			"fail",
			"multi-touch",
			null,
			GestureActivationState.FAILED,
		);
	}

	if (ancestorDismissing) {
		return createDecision(
			"fail",
			"ancestor-dismissing",
			null,
			GestureActivationState.FAILED,
		);
	}

	if (!runtime.participation.canTrackGesture || !runtime.policy.enabled) {
		return createDecision(
			"fail",
			"disabled",
			null,
			GestureActivationState.FAILED,
		);
	}

	return null;
};

const resolveOffsetFailureDecision = (
	offset: OffsetRuleResult,
): PanActivationDecision | null => {
	"worklet";
	if (offset.nextActivationState !== GestureActivationState.FAILED) {
		return null;
	}

	return createDecision(
		"fail",
		"offset-failed",
		null,
		offset.nextActivationState,
	);
};

const resolveDirectionGateDecision = (
	swipeDirection: Direction | null,
	runtime: PanGestureRuntime,
	offset: OffsetRuleResult,
	childDirectionClaims: DirectionClaimMap,
	currentScreenKey: string,
): PanActivationDecision | null => {
	"worklet";
	if (!swipeDirection) {
		return createDecision(
			"wait",
			"no-direction",
			null,
			offset.nextActivationState,
		);
	}

	if (runtime.participation.ownershipStatus[swipeDirection] !== "self") {
		return createDecision(
			"fail",
			"ownership",
			swipeDirection,
			offset.nextActivationState,
		);
	}

	const childClaim = childDirectionClaims[swipeDirection];
	if (shouldDeferToChildClaim(childClaim, currentScreenKey)) {
		return createDecision(
			"fail",
			"child-claim",
			swipeDirection,
			offset.nextActivationState,
		);
	}

	if (offset.nextActivationState !== GestureActivationState.PASSED) {
		return createDecision(
			"wait",
			"threshold-pending",
			swipeDirection,
			offset.nextActivationState,
		);
	}

	return null;
};

const resolveSnapLockDecision = (
	hasSnapPoints: boolean,
	gestureSnapLocked: boolean,
	isExpandGesture: boolean,
	swipeDirection: Direction,
	nextActivationState: GestureActivationState,
): PanActivationDecision | null => {
	"worklet";
	if (!hasSnapPoints || !gestureSnapLocked || !isExpandGesture) {
		return null;
	}

	return createDecision(
		"fail",
		"snap-locked",
		swipeDirection,
		nextActivationState,
	);
};

const resolveSnapScrollExpansionDecision = (
	runtime: PanGestureRuntime,
	swipeDirection: Direction,
	nextActivationState: GestureActivationState,
): PanActivationDecision | null => {
	"worklet";
	const {
		participation,
		policy,
		stores: { animations, system },
	} = runtime;
	const { hasAutoSnapPoint, snapPoints, minSnapPoint, maxSnapPoint } =
		participation.effectiveSnapPoints;

	if (policy.sheetScrollGestureBehavior === "collapse-only") {
		return createDecision(
			"fail",
			"scroll-collapse-only",
			swipeDirection,
			nextActivationState,
		);
	}

	const { resolvedMaxSnapPoint } = resolveRuntimeSnapPoints({
		snapPoints,
		hasAutoSnapPoint,
		resolvedAutoSnapPoint: system.resolvedAutoSnapPoint.get(),
		minSnapPoint,
		maxSnapPoint,
		canDismiss: participation.canDismiss,
	});

	const canExpandMore =
		animations.progress.get() < resolvedMaxSnapPoint - EPSILON &&
		system.targetProgress.get() < resolvedMaxSnapPoint - EPSILON;

	if (canExpandMore) {
		return null;
	}

	return createDecision(
		"fail",
		"scroll-max-expanded",
		swipeDirection,
		nextActivationState,
	);
};

const resolveDismissingDecision = (
	hasSnapPoints: boolean,
	isDismissing: boolean,
	swipeDirection: Direction,
	nextActivationState: GestureActivationState,
): PanActivationDecision | null => {
	"worklet";
	if (hasSnapPoints || !isDismissing) {
		return null;
	}

	return createDecision(
		"wait",
		"dismissing",
		swipeDirection,
		nextActivationState,
	);
};

const resolveUntouchedScrollDecision = (
	scrollState: ScrollGestureState | null,
	swipeDirection: Direction,
	nextActivationState: GestureActivationState,
): PanActivationDecision | null => {
	"worklet";
	if (scrollState?.isTouched ?? false) {
		return null;
	}

	return createDecision(
		"activate",
		"ready",
		swipeDirection,
		nextActivationState,
	);
};

const resolveScrollBoundaryDecision = (
	scrollState: ScrollGestureState,
	swipeDirection: Direction,
	activeSnapAxis: ActiveSnapAxis,
	nextActivationState: GestureActivationState,
): PanActivationDecision | null => {
	"worklet";
	const atBoundary = checkScrollBoundary(
		scrollState,
		swipeDirection,
		activeSnapAxis?.config.inverted,
	);

	if (atBoundary) {
		return null;
	}

	return createDecision(
		"fail",
		"scroll-boundary",
		swipeDirection,
		nextActivationState,
	);
};

const resolveScrollDecision = (
	runtime: PanGestureRuntime,
	scrollState: ScrollGestureState | null,
	swipeDirection: Direction,
	activeSnapAxis: ActiveSnapAxis,
	isExpandGesture: boolean,
	nextActivationState: GestureActivationState,
): PanActivationDecision => {
	"worklet";
	const hasSnapPoints = runtime.participation.effectiveSnapPoints.hasSnapPoints;

	const dismissingDecision = resolveDismissingDecision(
		hasSnapPoints,
		Boolean(runtime.stores.gestures.dismissing.get()),
		swipeDirection,
		nextActivationState,
	);
	if (dismissingDecision) return dismissingDecision;

	const untouchedScrollDecision = resolveUntouchedScrollDecision(
		scrollState,
		swipeDirection,
		nextActivationState,
	);
	if (untouchedScrollDecision) return untouchedScrollDecision;

	const activeScrollState = scrollState as ScrollGestureState;
	const boundaryDecision = resolveScrollBoundaryDecision(
		activeScrollState,
		swipeDirection,
		activeSnapAxis,
		nextActivationState,
	);
	if (boundaryDecision) return boundaryDecision;

	const snapExpandDecision =
		hasSnapPoints && isExpandGesture
			? resolveSnapScrollExpansionDecision(
					runtime,
					swipeDirection,
					nextActivationState,
				)
			: null;

	return (
		snapExpandDecision ??
		createDecision("activate", "ready", swipeDirection, nextActivationState)
	);
};

export const resolvePanActivationMoveDecision = ({
	event,
	runtime,
	dimensions,
	initialTouch,
	activationState,
	ancestorDismissing,
	childDirectionClaims,
	currentScreenKey,
	scrollState,
}: ResolvePanActivationMoveDecisionProps): PanActivationDecision => {
	"worklet";
	const preflightDecision = resolvePreflightDecision(
		event,
		runtime,
		ancestorDismissing,
	);
	if (preflightDecision) return preflightDecision;

	const { policy } = runtime;
	const touch = event.changedTouches[0];
	const offset = resolveOffsetRules({
		touch,
		initialTouch,
		directions: policy.panActivationDirections,
		dimensions,
		activationState,
		activationArea: policy.gestureActivationArea,
		responseDistance: policy.gestureResponseDistance,
	});

	const offsetFailureDecision = resolveOffsetFailureDecision(offset);
	if (offsetFailureDecision) return offsetFailureDecision;

	if (runtime.stores.gestures.dragging.get()) {
		return createDecision(
			"activate",
			"already-dragging",
			null,
			offset.nextActivationState,
		);
	}

	const swipeDirection = getSwipeDirection(offset);
	const directionGateDecision = resolveDirectionGateDecision(
		swipeDirection,
		runtime,
		offset,
		childDirectionClaims,
		currentScreenKey,
	);
	if (directionGateDecision) return directionGateDecision;

	const activeDirection = swipeDirection as Direction;
	const { participation } = runtime;
	const { hasSnapPoints } = participation.effectiveSnapPoints;

	const activeSnapAxis = hasSnapPoints
		? getPanSnapAxisConfigForDirection(
				policy.snapAxisDirections,
				activeDirection,
			)
		: null;
	const isExpandGesture = activeSnapAxis?.config.expand === activeDirection;

	const snapLockDecision = resolveSnapLockDecision(
		hasSnapPoints,
		policy.gestureSnapLocked,
		isExpandGesture,
		activeDirection,
		offset.nextActivationState,
	);
	if (snapLockDecision) return snapLockDecision;

	return resolveScrollDecision(
		runtime,
		scrollState,
		activeDirection,
		activeSnapAxis,
		isExpandGesture,
		offset.nextActivationState,
	);
};
