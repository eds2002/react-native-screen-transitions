import { describe, expect, it } from "bun:test";
import { resolveSnapPinchRelease } from "../../../providers/screen/gestures/pinch/behavior/pinch-release";
import type {
	PinchGestureEvent,
	PinchGestureRuntime,
} from "../../../providers/screen/gestures/types";

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
			snapDirections: {
				collapse: "pinch-in",
				expand: "pinch-out",
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
				internal: {
					progressBaseline: shared(baseline),
					progressDeltaX: shared(0),
					progressDeltaY: shared(0),
					lockedSnapPoint: shared<number | null>(lockedSnapPoint),
					snapshot: createGestureSnapshotStore(),
				},
			},
		},
	}) as unknown as PinchGestureRuntime;

describe("snap pinch release", () => {
	it("selects the target from live gesture progress instead of the stored baseline", () => {
		const release = resolveSnapPinchRelease(
			{
				scale: 1.5,
				velocity: 0,
			} as PinchGestureEvent,
			createSnapRuntime(),
		);

		expect(release.target).toBe(1);
		expect(release.commitProgress).toBe(1);
		expect(release.resetValuesImmediately).toBe(true);
	});

	it("uses the max snap point when a locked snap point has not been primed", () => {
		const release = resolveSnapPinchRelease(
			{
				scale: 1.25,
				velocity: 0,
			} as PinchGestureEvent,
			createSnapRuntime({
				gestureSnapLocked: true,
				lockedSnapPoint: null,
			}),
		);

		expect(release.target).toBe(1);
		expect(release.commitProgress).toBe(0.75);
	});
});
