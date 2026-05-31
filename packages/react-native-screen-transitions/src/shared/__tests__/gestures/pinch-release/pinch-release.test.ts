import { describe, expect, it } from "bun:test";
import { resolveSnapPinchRelease } from "../../../providers/screen/gestures/pinch/pinch-release";
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

const createSnapRuntime = ({
	progress = 0.5,
	baseline = 0.5,
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
			gestureProgressMode: "progress-driven",
			gestureReleaseVelocityScale: 1,
			gestureSnapVelocityImpact: 0.1,
			gestureSnapLocked: false,
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
		},
		gestureProgressBaseline: shared(baseline),
		lockedSnapPoint: shared(1),
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
});
