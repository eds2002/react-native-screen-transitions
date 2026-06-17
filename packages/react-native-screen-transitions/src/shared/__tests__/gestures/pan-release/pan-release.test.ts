import { describe, expect, it } from "bun:test";
import type { ActiveGesture } from "../../../types/gesture.types";
import type {
	GestureDimensions,
	PanGestureEvent,
	PanGestureRuntime,
	PanReleaseResult,
} from "../../../providers/screen/gestures/types";
import {
	buildPanReleasePlan,
	resolveSnapPanRelease,
} from "../../../providers/screen/gestures/pan/behavior/pan-release";

const dimensions = {
	width: 400,
	height: 800,
} satisfies GestureDimensions;

const createRuntime = (gestureReleaseVelocityScale = 1) =>
	({
		policy: {
			gestureReleaseVelocityScale,
		},
		stores: {
			gestures: {
				active: shared("horizontal" as ActiveGesture),
			},
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

const createGestureSnapshotStore = () => ({
	x: shared(0),
	y: shared(0),
	normX: shared(0),
	normY: shared(0),
	velocity: shared(0),
	scale: shared(1),
	normScale: shared(0),
	focalX: shared(0),
	focalY: shared(0),
	rotation: shared(0),
	raw: {
		x: shared(0),
		y: shared(0),
		normX: shared(0),
		normY: shared(0),
		scale: shared(1),
		normScale: shared(0),
		rotation: shared(0),
	},
	active: shared(null),
	direction: shared(null),
});

const createSnapRuntime = ({
	progress = 0.5,
	baseline = 0.5,
	activeGesture = "horizontal-inverted" as ActiveGesture,
	gestureSnapLocked = false,
	lockedSnapPoint = 1 as number | null,
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
			gestureReleaseVelocityScale: 1,
			gestureSnapVelocityImpact: 0.1,
			gestureSnapLocked,
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
				internal: {
					progressBaseline: shared(baseline),
					progressDeltaX: shared(0),
					progressDeltaY: shared(0),
					lockedSnapPoint: shared<number | null>(lockedSnapPoint),
					snapshot: createGestureSnapshotStore(),
				},
			},
		},
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
	it("hands dismiss velocity to progress and gesture reset", () => {
		const plan = buildPanReleasePlan(
			createRelease(),
			createRuntime(),
			dimensions,
			rawEvent,
		);

		expect(plan.progressVelocity).toBe(4);
		expect(plan.resetVelocityX).toBe(120);
		expect(plan.resetVelocityY).toBe(-240);
		expect(plan.resetVelocityNormX).toBeCloseTo(0.3, 5);
		expect(plan.resetVelocityNormY).toBeCloseTo(-0.3, 5);
		expect(plan.handoffVelocity).toBeCloseTo(0.075, 5);
	});

	it("applies release velocity scale to dismiss reset and handoff velocity", () => {
		const plan = buildPanReleasePlan(
			createRelease({ initialVelocity: 4 }),
			createRuntime(2),
			dimensions,
			rawEvent,
		);

		expect(plan.progressVelocity).toBe(4);
		expect(plan.resetVelocityX).toBe(240);
		expect(plan.resetVelocityY).toBe(-480);
		expect(plan.resetVelocityNormX).toBeCloseTo(0.6, 5);
		expect(plan.resetVelocityNormY).toBeCloseTo(-0.6, 5);
		expect(plan.handoffVelocity).toBeCloseTo(0.15, 5);
	});

	it("resets cancelled gestures with release velocity", () => {
		const plan = buildPanReleasePlan(
			createRelease({ target: 1, shouldDismiss: false }),
			createRuntime(),
			dimensions,
			rawEvent,
		);

		expect(plan.progressVelocity).toBe(4);
		expect(plan.resetVelocityX).toBe(120);
		expect(plan.resetVelocityY).toBe(-240);
		expect(plan.handoffVelocity).toBe(0);
	});

	it("clamps negative release velocity scale to zero", () => {
		const plan = buildPanReleasePlan(
			createRelease(),
			createRuntime(-1),
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

	it("carries committed progress into the release plan", () => {
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
		const plan = buildPanReleasePlan(
			release,
			createRuntime(),
			dimensions,
			rawEvent,
		);

		expect(plan.commitProgress).toBe(1);
	});

	it("uses the max snap point when a locked snap point has not been primed", () => {
		const release = resolveSnapPanRelease(
			{
				translationX: -90,
				translationY: 0,
				velocityX: 0,
				velocityY: 0,
			} as PanGestureEvent,
			createSnapRuntime({
				gestureSnapLocked: true,
				lockedSnapPoint: null,
			}),
			dimensions,
		);

		expect(release.target).toBe(1);
		expect(release.commitProgress).toBe(0.725);
	});
});
