import { beforeEach, describe, expect, it } from "bun:test";
import type { ScreenInterpolatorFrame } from "../../providers/screen/orchestrator/helpers/pipeline";
import { createInterpolatorScope } from "../../providers/screen/orchestrator/styles/helpers/create-interpolator-scope";
import { selectInterpolatorFrame } from "../../providers/screen/orchestrator/styles/helpers/select-interpolator-frame";
import { BoundStore, type Snapshot } from "../../stores/bounds";
import { createScreenPairKey } from "../../stores/bounds/helpers/link-pairs.helpers";

const createBounds = (x: number): Snapshot["bounds"] => ({
	x,
	y: 0,
	pageX: x,
	pageY: 0,
	width: 100,
	height: 100,
});

const createScreen = (key: string, progress: number, settled: number) => ({
	route: { key },
	progress,
	transitionProgress: progress,
	settled,
});

beforeEach(() => {
	globalThis.resetMutableRegistry();
});

describe("createInterpolatorScope", () => {
	it("keeps a settled reveal destination paired to its original source during a later push", () => {
		const previous = createScreen("screen-a", 1, 1);
		const current = createScreen("screen-b", 1, 1);
		const next = createScreen("screen-c", 0.5, 0);
		const frame = {
			previous,
			current,
			next,
			progress: 1.5,
			transitionProgress: 1.5,
			focused: false,
			active: next,
			inactive: current,
			logicallySettled: 0,
		} as unknown as ScreenInterpolatorFrame;

		const originalPair = createScreenPairKey("screen-a", "screen-b");
		BoundStore.link.setSource(
			originalPair,
			"event-1",
			"screen-a",
			createBounds(10),
		);
		BoundStore.link.setDestination(
			originalPair,
			"event-1",
			"screen-b",
			createBounds(20),
		);

		const laterPair = createScreenPairKey("screen-b", "screen-c");
		BoundStore.link.setSource(
			laterPair,
			"event-1",
			"screen-b",
			createBounds(20),
		);
		BoundStore.link.setDestination(
			laterPair,
			"event-1",
			"screen-c",
			createBounds(30),
		);

		const scope = createInterpolatorScope({
			frame,
			selectedFrame: selectInterpolatorFrame(frame, true),
		});

		expect(scope.next).toBeUndefined();
		expect(scope.bounds("event-1").link()?.destination?.screenKey).toBe(
			"screen-b",
		);
	});

});
