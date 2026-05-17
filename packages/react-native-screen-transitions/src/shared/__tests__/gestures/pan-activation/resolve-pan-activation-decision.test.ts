import { describe, expect, it } from "bun:test";
import type { GestureTouchEvent } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { resolvePanActivationMoveDecision } from "../../../providers/screen/gestures/pan/pan-activation-decision";
import {
	NO_DIRECTION_CLAIMS,
	type DirectionClaimMap,
	type PanGestureRuntime,
} from "../../../providers/screen/gestures/types";
import {
	GestureActivationState,
	type ScrollGestureState,
} from "../../../types/gesture.types";
import type { DirectionOwnership } from "../../../types/ownership.types";

const dimensions = {
	width: 400,
	height: 800,
};

const selfOwnership = {
	vertical: "self",
	"vertical-inverted": "self",
	horizontal: "self",
	"horizontal-inverted": "self",
} satisfies DirectionOwnership;

const shared = <T>(initialValue: T): SharedValue<T> => {
	let value = initialValue;

	return {
		get: () => value,
		set: (nextValue: T) => {
			value = nextValue;
		},
	} as SharedValue<T>;
};

const moveEvent = (
	x: number,
	y: number,
	numberOfTouches = 1,
): GestureTouchEvent =>
	({
		numberOfTouches,
		changedTouches: [{ x, y }],
	}) as GestureTouchEvent;

const scrollState = ({
	isTouched = true,
	verticalOffset = 0,
	horizontalOffset = 0,
}: {
	isTouched?: boolean;
	verticalOffset?: number;
	horizontalOffset?: number;
} = {}): ScrollGestureState => ({
	isTouched,
	vertical: {
		offset: verticalOffset,
		contentSize: 1000,
		layoutSize: 400,
	},
	horizontal: {
		offset: horizontalOffset,
		contentSize: 1000,
		layoutSize: 400,
	},
});

interface RuntimeOverrides {
	canTrackGesture?: boolean;
	ownershipStatus?: Partial<DirectionOwnership>;
	policy?: Partial<PanGestureRuntime["policy"]>;
	effectiveSnapPoints?: Partial<
		PanGestureRuntime["participation"]["effectiveSnapPoints"]
	>;
	dragging?: number;
	dismissing?: number;
	progress?: number;
	targetProgress?: number;
	resolvedAutoSnapPoint?: number;
}

const createRuntime = ({
	canTrackGesture = true,
	ownershipStatus,
	policy,
	effectiveSnapPoints,
	dragging = 0,
	dismissing = 0,
	progress = 0.5,
	targetProgress = 0.5,
	resolvedAutoSnapPoint = -1,
}: RuntimeOverrides = {}): PanGestureRuntime =>
	({
		participation: {
			isFirstKey: false,
			canDismiss: true,
			canTrackGesture,
			effectiveSnapPoints: {
				hasSnapPoints: false,
				hasAutoSnapPoint: false,
				snapPoints: [],
				minSnapPoint: -1,
				maxSnapPoint: -1,
				...effectiveSnapPoints,
			},
			claimedDirections: {
				vertical: true,
				"vertical-inverted": true,
				horizontal: true,
				"horizontal-inverted": true,
			},
			ownershipStatus: {
				...selfOwnership,
				...ownershipStatus,
			},
		},
		policy: {
			enabled: true,
			gestureDirection: "bidirectional",
			panActivationDirections: {
				vertical: true,
				verticalInverted: true,
				horizontal: true,
				horizontalInverted: true,
			},
			snapAxisDirections: {
				vertical: {
					collapse: "vertical",
					expand: "vertical-inverted",
					inverted: false,
					progressSign: -1,
				},
				horizontal: {
					collapse: "horizontal",
					expand: "horizontal-inverted",
					inverted: false,
					progressSign: -1,
				},
			},
			gestureProgressMode: "progress-driven",
			gestureSensitivity: 1,
			gestureVelocityImpact: 0,
			gestureSnapVelocityImpact: 0,
			gestureReleaseVelocityScale: 1,
			gestureActivationArea: "screen",
			gestureSnapLocked: false,
			sheetScrollGestureBehavior: "expand-and-collapse",
			gestureResponseDistance: undefined,
			transitionSpec: undefined,
			...policy,
		},
		stores: {
			gestures: {
				dragging: shared(dragging),
				dismissing: shared(dismissing),
				active: shared(null),
				direction: shared(null),
			},
			animations: {
				progress: shared(progress),
			},
			system: {
				targetProgress: shared(targetProgress),
				resolvedAutoSnapPoint: shared(resolvedAutoSnapPoint),
			},
		},
		gestureProgressBaseline: shared(1),
		lockedSnapPoint: shared(-1),
	}) as unknown as PanGestureRuntime;

interface DecisionOverrides {
	event?: GestureTouchEvent;
	runtime?: PanGestureRuntime;
	activationState?: GestureActivationState;
	ancestorDismissing?: boolean;
	childDirectionClaims?: DirectionClaimMap;
	scrollState?: ScrollGestureState | null;
}

const decide = ({
	event = moveEvent(0, 15),
	runtime = createRuntime(),
	activationState = GestureActivationState.PENDING,
	ancestorDismissing = false,
	childDirectionClaims = NO_DIRECTION_CLAIMS,
	scrollState: currentScrollState = null,
}: DecisionOverrides = {}) =>
	resolvePanActivationMoveDecision({
		event,
		runtime,
		dimensions,
		initialTouch: { x: 0, y: 0 },
		activationState,
		ancestorDismissing,
		childDirectionClaims,
		currentScreenKey: "self",
		scrollState: currentScrollState,
	});

describe("pan activation decision", () => {
	it("waits while dominant movement is below activation threshold", () => {
		const decision = decide({
			event: moveEvent(5, 2),
		});

		expect(decision.action).toBe("wait");
		expect(decision.reason).toBe("threshold-pending");
		expect(decision.direction).toBe("horizontal");
		expect(decision.nextActivationState).toBe(GestureActivationState.PENDING);
	});

	it("activates an owned direction once offset rules pass", () => {
		const decision = decide();

		expect(decision.action).toBe("activate");
		expect(decision.reason).toBe("ready");
		expect(decision.direction).toBe("vertical");
		expect(decision.nextActivationState).toBe(GestureActivationState.PASSED);
	});

	it("fails when the detected direction is owned by an ancestor", () => {
		const decision = decide({
			runtime: createRuntime({
				ownershipStatus: {
					vertical: "ancestor",
				},
			}),
		});

		expect(decision.action).toBe("fail");
		expect(decision.reason).toBe("ownership");
		expect(decision.direction).toBe("vertical");
		expect(decision.nextActivationState).toBe(GestureActivationState.PASSED);
	});

	it("fails while an active child claim shadows the detected direction", () => {
		const childDirectionClaims = {
			...NO_DIRECTION_CLAIMS,
			vertical: {
				routeKey: "child",
				isDismissing: shared(0),
			},
		} satisfies DirectionClaimMap;

		const decision = decide({ childDirectionClaims });

		expect(decision.action).toBe("fail");
		expect(decision.reason).toBe("child-claim");
		expect(decision.direction).toBe("vertical");
	});

	it("waits during non-snap dismissal instead of reactivating", () => {
		const decision = decide({
			runtime: createRuntime({ dismissing: 1 }),
		});

		expect(decision.action).toBe("wait");
		expect(decision.reason).toBe("dismissing");
		expect(decision.direction).toBe("vertical");
	});

	it("fails when touched scroll content is not at its handoff boundary", () => {
		const decision = decide({
			scrollState: scrollState({ verticalOffset: 20 }),
		});

		expect(decision.action).toBe("fail");
		expect(decision.reason).toBe("scroll-boundary");
		expect(decision.direction).toBe("vertical");
	});

	it("fails snap expand gestures while snap movement is locked", () => {
		const decision = decide({
			event: moveEvent(0, -15),
			runtime: createRuntime({
				effectiveSnapPoints: {
					hasSnapPoints: true,
					snapPoints: [0.25, 1],
					minSnapPoint: 0,
					maxSnapPoint: 1,
				},
				policy: {
					gestureSnapLocked: true,
				},
			}),
		});

		expect(decision.action).toBe("fail");
		expect(decision.reason).toBe("snap-locked");
		expect(decision.direction).toBe("vertical-inverted");
	});

	it("blocks scroll-driven snap expansion in collapse-only mode", () => {
		const decision = decide({
			event: moveEvent(0, -15),
			scrollState: scrollState(),
			runtime: createRuntime({
				effectiveSnapPoints: {
					hasSnapPoints: true,
					snapPoints: [0.25, 1],
					minSnapPoint: 0,
					maxSnapPoint: 1,
				},
				policy: {
					sheetScrollGestureBehavior: "collapse-only",
				},
			}),
		});

		expect(decision.action).toBe("fail");
		expect(decision.reason).toBe("scroll-collapse-only");
		expect(decision.direction).toBe("vertical-inverted");
	});

	it("allows scroll-driven snap expansion when more expansion is available", () => {
		const decision = decide({
			event: moveEvent(0, -15),
			scrollState: scrollState(),
			runtime: createRuntime({
				progress: 0.5,
				targetProgress: 0.5,
				effectiveSnapPoints: {
					hasSnapPoints: true,
					snapPoints: [0.25, 1],
					minSnapPoint: 0,
					maxSnapPoint: 1,
				},
			}),
		});

		expect(decision.action).toBe("activate");
		expect(decision.reason).toBe("ready");
		expect(decision.direction).toBe("vertical-inverted");
	});

	it("fails scroll-driven snap expansion at the resolved max snap point", () => {
		const decision = decide({
			event: moveEvent(0, -15),
			scrollState: scrollState(),
			runtime: createRuntime({
				progress: 1,
				targetProgress: 1,
				effectiveSnapPoints: {
					hasSnapPoints: true,
					snapPoints: [0.25, 1],
					minSnapPoint: 0,
					maxSnapPoint: 1,
				},
			}),
		});

		expect(decision.action).toBe("fail");
		expect(decision.reason).toBe("scroll-max-expanded");
		expect(decision.direction).toBe("vertical-inverted");
	});
});
