import { describe, expect, it } from "bun:test";
import type { SharedValue } from "react-native-reanimated";
import {
	type DirectionClaimMap,
	NO_DIRECTION_CLAIMS,
} from "../../../providers/screen/gestures/types";
import { resolvePanActivationMoveDecision } from "../../../providers/screen/gestures/pan/pan-activation-decision";
import { resolveShadowingClaimDirections } from "../../../providers/screen/gestures/ownership/shadowing-claims";
import { GestureActivationState } from "../../../types/gesture.types";
import type { ClaimedDirections } from "../../../types/ownership.types";

const shared = <T>(initialValue: T): SharedValue<T> => {
	let value = initialValue;
	return {
		get: () => value,
		set: (nextValue: T) => {
			value = nextValue;
		},
		value,
	} as SharedValue<T>;
};

const createRuntime = () =>
	({
		participation: {
			canTrackGesture: true,
			ownershipStatus: {
				vertical: "none",
				"vertical-inverted": "none",
				horizontal: "self",
				"horizontal-inverted": "none",
			},
			effectiveSnapPoints: {
				hasSnapPoints: false,
			},
		},
		policy: {
			enabled: true,
			panActivationDirections: {
				vertical: false,
				verticalInverted: false,
				horizontal: true,
				horizontalInverted: false,
			},
			gestureActivationArea: "screen",
			gestureResponseDistance: undefined,
		},
		stores: {
			gestures: {
				dragging: shared(0),
				dismissing: shared(0),
			},
		},
	}) as any;

const createMoveEvent = (x: number, y: number) =>
	({
		numberOfTouches: 1,
		changedTouches: [{ x, y }],
	}) as any;

const noClaims = (): ClaimedDirections => ({
	vertical: false,
	"vertical-inverted": false,
	horizontal: false,
	"horizontal-inverted": false,
});

describe("gesture ownership activation", () => {
	it("keeps an ancestor from activating while a child owner is dismissing", () => {
		const childDirectionClaims: DirectionClaimMap = {
			...NO_DIRECTION_CLAIMS,
			horizontal: {
				routeKey: "child",
				isDismissing: shared(1),
			},
		};

		const decision = resolvePanActivationMoveDecision({
			event: createMoveEvent(30, 10),
			runtime: createRuntime(),
			dimensions: { width: 390, height: 844 },
			initialTouch: { x: 10, y: 10 },
			activationState: GestureActivationState.PENDING,
			ancestorDismissing: false,
			childDirectionClaims,
			currentScreenKey: "ancestor",
			scrollState: null,
		});

		expect(decision.action).toBe("fail");
		expect(decision.reason).toBe("child-claim");
		expect(decision.direction).toBe("horizontal");
	});

	it("uses the visible previous route's claims for retained closing routes", () => {
		const currentClaimedDirections = {
			...noClaims(),
			vertical: true,
		};
		const previousClaimedDirections = {
			...noClaims(),
			horizontal: true,
		};

		expect(
			resolveShadowingClaimDirections({
				currentActivity: "closing",
				currentClaimedDirections,
				previousClaimedDirections,
			}),
		).toEqual(previousClaimedDirections);
	});

	it("drops retained closing route claims when the visible previous route has none", () => {
		const currentClaimedDirections = {
			...noClaims(),
			horizontal: true,
		};
		const previousClaimedDirections = noClaims();

		expect(
			resolveShadowingClaimDirections({
				currentActivity: "closing",
				currentClaimedDirections,
				previousClaimedDirections,
			}),
		).toEqual(previousClaimedDirections);
	});
});
