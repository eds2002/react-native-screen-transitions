import { describe, expect, it } from "bun:test";
import type { ActiveGesture } from "../../../types/gesture.types";
import type {
	GestureDimensions,
	GestureProgressMode,
	PanGestureEvent,
	PanGestureRuntime,
	PanReleaseResult,
} from "../../../providers/screen/gestures/types";
import {
	buildPanReleasePlan,
	resolveSnapPanRelease,
} from "../../../providers/screen/gestures/pan/pan-release";

const dimensions = {
	width: 400,
	height: 800,
} satisfies GestureDimensions;

const createRuntime = (
	gestureProgressMode: GestureProgressMode,
	gestureReleaseVelocityScale = 1,
) =>
	({
		policy: {
			gestureProgressMode,
			gestureReleaseVelocityScale,
		},
	}) as PanGestureRuntime;

const shared = <T>(initial: T) => {
	let value = initial;

	return {
		get: () => value,
		set: (next: T) => {
			value = next;
		},
	};
};

const createSnapRuntime = ({
	progress = 0.5,
	baseline = 0.5,
	activeGesture = "horizontal-inverted" as ActiveGesture,
	gestureProgressMode = "progress-driven" as GestureProgressMode,
} = {}) =>
	({
		participation: {
			canDismiss: false,
			effectiveSnapPoints: {
				hasSnapPoints: true,
				hasAutoSnapPoint: false,
				snapPoints: [0.5, 1],
				minSnapPoint: 0.5,
				maxSnapPoint: 1,
			},
		},
		policy: {
			gestureProgressMode,
			gestureReleaseVelocityScale: 1,
			gestureSnapVelocityImpact: 0.1,
			gestureSnapLocked: false,
			snapAxisDirections: {
				horizontal: {
					collapse: "horizontal",
					expand: "horizontal-inverted",
					inverted: false,
					progressSign: -1,
				},
				vertical: null,
			},
			transitionSpec: undefined,
		},
		stores: {
			animations: {
				progress: shared(progress),
			},
			system: {
				resolvedAutoSnapPoint: shared(0),
			},
			gestures: {
				active: shared(activeGesture),
			},
		},
		gestureProgressBaseline: shared(baseline),
		lockedSnapPoint: shared(1),
	}) as unknown as PanGestureRuntime;

const createRelease = (
	overrides: Partial<PanReleaseResult> = {},
): PanReleaseResult => ({
	target: 0,
	shouldDismiss: true,
	initialVelocity: 4,
	transitionSpec: undefined,
	resetSpec: undefined,
	...overrides,
});

const rawEvent = {
	velocityX: 120,
	velocityY: -240,
} as PanGestureEvent;

describe("pan release plan", () => {
	it("hands dismiss velocity to progress and neutralizes normalized values in progress-driven mode", () => {
		const plan = buildPanReleasePlan(
			createRelease(),
			createRuntime("progress-driven"),
			dimensions,
			rawEvent,
		);

		expect(plan.progressVelocity).toBe(4);
		expect(plan.resetVelocityX).toBe(0);
		expect(plan.resetVelocityY).toBe(0);
		expect(plan.resetVelocityNormX).toBe(0);
		expect(plan.resetVelocityNormY).toBe(0);
		expect(plan.resetNormalizedValues).toBe(true);
		expect(plan.preserveRawValues).toBe(true);
	});

	it("keeps dismiss velocity on gesture reset and preserves normalized values in freeform mode", () => {
		const plan = buildPanReleasePlan(
			createRelease(),
			createRuntime("freeform"),
			dimensions,
			rawEvent,
		);

		expect(plan.progressVelocity).toBe(0);
		expect(plan.resetVelocityX).toBe(120);
		expect(plan.resetVelocityY).toBe(-240);
		expect(plan.resetVelocityNormX).toBe(0.3);
		expect(plan.resetVelocityNormY).toBe(-0.3);
		expect(plan.resetNormalizedValues).toBe(false);
		expect(plan.preserveRawValues).toBe(true);
	});

	it("resets cancelled gestures in progress-driven mode", () => {
		const plan = buildPanReleasePlan(
			createRelease({ target: 1, shouldDismiss: false }),
			createRuntime("progress-driven"),
			dimensions,
			rawEvent,
		);

		expect(plan.progressVelocity).toBe(4);
		expect(plan.resetVelocityX).toBe(120);
		expect(plan.resetVelocityY).toBe(-240);
		expect(plan.resetNormalizedValues).toBe(true);
		expect(plan.preserveRawValues).toBe(false);
	});

	it("keeps cancelled freeform velocity off progress and on gesture reset", () => {
		const plan = buildPanReleasePlan(
			createRelease({ target: 1, shouldDismiss: false }),
			createRuntime("freeform"),
			dimensions,
			rawEvent,
		);

		expect(plan.progressVelocity).toBe(0);
		expect(plan.resetVelocityX).toBe(120);
		expect(plan.resetVelocityY).toBe(-240);
		expect(plan.resetNormalizedValues).toBe(true);
		expect(plan.preserveRawValues).toBe(false);
	});

	it("clamps negative release velocity scale to zero", () => {
		const plan = buildPanReleasePlan(
			createRelease(),
			createRuntime("freeform", -1),
			dimensions,
			rawEvent,
		);

		expect(plan.resetVelocityX).toBe(0);
		expect(plan.resetVelocityY).toBe(0);
		expect(plan.resetVelocityNormX).toBe(0);
		expect(plan.resetVelocityNormY).toBe(0);
	});
});

describe("snap pan release", () => {
	it("selects the target from live gesture progress instead of the stored baseline", () => {
		const release = resolveSnapPanRelease(
			{
				translationX: -200,
				translationY: 0,
				velocityX: 0,
				velocityY: 0,
			} as PanGestureEvent,
			createSnapRuntime(),
			dimensions,
		);

		expect(release.target).toBe(1);
		expect(release.commitProgress).toBe(1);
		expect(release.resetNormalizedValuesImmediately).toBe(true);
	});

	it("still snaps back when the live drag has not crossed the midpoint", () => {
		const release = resolveSnapPanRelease(
			{
				translationX: -90,
				translationY: 0,
				velocityX: 0,
				velocityY: 0,
			} as PanGestureEvent,
			createSnapRuntime(),
			dimensions,
		);

		expect(release.target).toBe(0.5);
		expect(release.commitProgress).toBe(0.725);
	});

	it("carries committed progress and immediate normalized reset into the release plan", () => {
		const release = resolveSnapPanRelease(
			{
				translationX: -200,
				translationY: 0,
				velocityX: 0,
				velocityY: 0,
			} as PanGestureEvent,
			createSnapRuntime(),
			dimensions,
		);
		const plan = buildPanReleasePlan(release, createRuntime("progress-driven"), dimensions, rawEvent);

		expect(plan.commitProgress).toBe(1);
		expect(plan.resetNormalizedValuesImmediately).toBe(true);
	});
});
