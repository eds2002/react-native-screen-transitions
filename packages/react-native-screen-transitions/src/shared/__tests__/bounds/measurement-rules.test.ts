import { beforeEach, describe, expect, it } from "bun:test";
import { getInitialDestinationMeasurePairKey } from "../../components/boundary/utils/destination-signals";
import {
	applyVisibilityBlockOffset,
	isMeasurementInViewport,
} from "../../components/boundary/utils/measured-bounds";
import { getRefreshBoundarySignal } from "../../components/boundary/utils/refresh-signals";
import { getInitialSourceCaptureSignal } from "../../components/boundary/utils/source-signals";
import { BoundStore, type Snapshot } from "../../stores/bounds";
import {
	createPendingPairKey,
	createScreenPairKey,
} from "../../stores/bounds/helpers/link-pairs.helpers";
import { pairs } from "../../stores/bounds/internals/state";
import { getVisibilityBlockOffset } from "../../utils/visibility-block-offset";

const createBounds = (): Snapshot["bounds"] => ({
	x: 0,
	y: 0,
	pageX: 0,
	pageY: 0,
	width: 100,
	height: 100,
});

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("bounds client measurement contract", () => {
	it("auto source capture waits for destination then emits once", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const measuredTargets: Array<{ type: "source"; pairKey: string }> = [];
		let lastSignal: string | null = null;

		const runAutoSourceReaction = () => {
			const captureSignal = getInitialSourceCaptureSignal({
				enabled: true,
				sourcePairKey: pairKey,
				linkId: "card",
				shouldAutoMeasure: true,
				linkState: pairs.get(),
			});

			if (!captureSignal || captureSignal.signal === lastSignal) {
				return;
			}

			lastSignal = captureSignal.signal;
			measuredTargets.push({
				type: "source",
				pairKey: captureSignal.pairKey,
			});
		};

		runAutoSourceReaction();
		runAutoSourceReaction();

		expect(measuredTargets).toEqual([]);

		BoundStore.link.setDestination(
			pairKey,
			"card",
			"screen-b",
			createBounds(),
		);

		runAutoSourceReaction();
		runAutoSourceReaction();

		expect(measuredTargets).toEqual([{ type: "source", pairKey }]);
	});

	it("press source capture rewrites the same pending link", () => {
		const pendingPairKey = createPendingPairKey("screen-a");
		const first = createBounds();
		const second = {
			...createBounds(),
			x: 20,
			pageX: 20,
		};

		BoundStore.link.setSource(pendingPairKey, "card", "screen-a", first);
		BoundStore.link.setSource(pendingPairKey, "card", "screen-a", second);

		expect(Object.keys(pairs.get()[pendingPairKey].links)).toEqual(["card"]);
		expect(BoundStore.link.getSource(pendingPairKey, "card")?.bounds).toEqual(
			second,
		);
		expect(
			BoundStore.link.getLink(pendingPairKey, "card")?.initialSource?.bounds,
		).toEqual(first);
	});

	it("destination attach stops after the destination has measured once", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		const getDestinationPairKey = () =>
			getInitialDestinationMeasurePairKey({
				enabled: true,
				destinationPairKey: pairKey,
				linkId: "card",
				linkState: pairs.get(),
			});

		expect(getDestinationPairKey()).toBe(pairKey);

		BoundStore.link.setDestination(
			pairKey,
			"card",
			"screen-b",
			createBounds(),
		);

		expect(getDestinationPairKey()).toBeNull();
	});

	it("attaches nested initial destinations to the nearest ancestor pair", () => {
		const ancestorPairKey = createScreenPairKey("screen-a", "nested-route");

		const getDestinationPairKey = () =>
			getInitialDestinationMeasurePairKey({
				enabled: true,
				ancestorDestinationPairKey: ancestorPairKey,
				linkId: "card",
				linkState: pairs.get(),
			});

		expect(getDestinationPairKey()).toBe(ancestorPairKey);

		BoundStore.link.setDestination(
			ancestorPairKey,
			"card",
			"nested-index",
			createBounds(),
		);

		expect(getDestinationPairKey()).toBeNull();
		expect(
			BoundStore.link.getLink(ancestorPairKey, "card")?.destination
				?.screenKey,
		).toBe("nested-index");
	});

	it("lets nested destination-first links wake passive ancestor-pair sources", () => {
		const ancestorPairKey = createScreenPairKey("screen-a", "nested-route");

		BoundStore.link.setDestination(
			ancestorPairKey,
			"title",
			"nested-index",
			createBounds(),
		);

		expect(
			getInitialSourceCaptureSignal({
				enabled: true,
				sourcePairKey: ancestorPairKey,
				linkId: "title",
				shouldAutoMeasure: true,
				linkState: pairs.get(),
			}),
		).toEqual({
			pairKey: ancestorPairKey,
			signal: "source|screen-a<>nested-route|title",
		});
	});

	it("blocks destination measurements that are outside the viewport", () => {
		expect(isMeasurementInViewport(createBounds(), 400, 800)).toBe(true);
		expect(
			isMeasurementInViewport(
				{
					...createBounds(),
					pageX: 1000,
				},
				400,
				800,
			),
		).toBe(false);
		expect(
			isMeasurementInViewport(
				{
					...createBounds(),
					width: 0,
				},
				400,
				800,
			),
		).toBe(false);
	});

	it("normalizes visibility-blocked destination measurements before viewport checks", () => {
		const offset = getVisibilityBlockOffset(800);
		const blockedMeasurement = {
			...createBounds(),
			pageY: offset,
		};

		expect(isMeasurementInViewport(blockedMeasurement, 400, 800)).toBe(false);

		const normalized = applyVisibilityBlockOffset(
			blockedMeasurement,
			offset,
		);

		expect(normalized.pageY).toBe(0);
		expect(normalized.y).toBe(blockedMeasurement.y);
		expect(isMeasurementInViewport(normalized, 400, 800)).toBe(true);
	});

	it("refreshes the current active grouped source at settled points", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		BoundStore.link.setActiveGroupId(pairKey, "colors", "2");
		BoundStore.link.setSource(
			pairKey,
			"2",
			"screen-a",
			createBounds(),
			{},
			"colors",
		);

		const getSignal = (linkId: string) =>
			getRefreshBoundarySignal({
				enabled: true,
				currentScreenKey: "screen-a",
				sourcePairKey: pairKey,
				linkId,
				group: "colors",
				shouldRefresh: true,
				closing: false,
				entering: false,
				animating: false,
				progress: 1,
				linkState: pairs.get(),
			});

		expect(getSignal("1")).toBeNull();
		expect(getSignal("2")).toEqual({
			type: "source",
			pairKey,
			signal: "source|screen-a<>screen-b|colors|2|settled",
		});
	});

	it("refreshes the current active grouped destination member", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		BoundStore.link.setActiveGroupId(pairKey, "colors", "2");
		BoundStore.link.setSource(
			pairKey,
			"2",
			"screen-a",
			createBounds(),
			{},
			"colors",
		);

		const getSignal = (linkId: string) =>
			getRefreshBoundarySignal({
				enabled: true,
				currentScreenKey: "screen-b",
				destinationPairKey: pairKey,
				linkId,
				group: "colors",
				shouldRefresh: true,
				closing: true,
				entering: false,
				animating: false,
				progress: 1,
				linkState: pairs.get(),
			});

		expect(getSignal("1")).toBeNull();
		expect(getSignal("2")).toEqual({
			type: "destination",
			pairKey,
			signal: "destination|screen-a<>screen-b|colors|2|closing",
		});
	});

	it("refreshes a non-group destination once for a stable close signal", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const measuredTargets: Array<{ type: "destination"; pairKey: string }> = [];
		let previousSignal: string | null = null;

		const runRefreshReaction = () => {
			const refreshSignal = getRefreshBoundarySignal({
				enabled: true,
				currentScreenKey: "screen-b",
				destinationPairKey: pairKey,
				linkId: "card",
				shouldRefresh: true,
				closing: true,
				entering: false,
				animating: false,
				progress: 1,
			});

			if (!refreshSignal || refreshSignal.signal === previousSignal) {
				return;
			}

			previousSignal = refreshSignal.signal;
			measuredTargets.push({
				type: refreshSignal.type,
				pairKey: refreshSignal.pairKey,
			});
		};

		runRefreshReaction();
		runRefreshReaction();

		expect(measuredTargets).toEqual([{ type: "destination", pairKey }]);
	});

	it("refreshes a nested destination through its ancestor pair", () => {
		const ancestorPairKey = createScreenPairKey("screen-a", "nested-route");

		expect(
			getRefreshBoundarySignal({
				enabled: true,
				currentScreenKey: "nested-index",
				ancestorDestinationPairKey: ancestorPairKey,
				linkId: "card",
				shouldRefresh: true,
				closing: true,
				entering: false,
				animating: false,
				progress: 1,
			}),
		).toEqual({
			type: "destination",
			pairKey: ancestorPairKey,
			signal: "destination|screen-a<>nested-route|nested-index|closing",
		});
	});

	it("does not refresh an ancestor destination while the nested screen is a source", () => {
		const ancestorPairKey = createScreenPairKey("screen-a", "nested-route");
		const nestedPairKey = createScreenPairKey("nested-index", "deep-route");

		expect(
			getRefreshBoundarySignal({
				enabled: true,
				currentScreenKey: "nested-index",
				sourcePairKey: nestedPairKey,
				ancestorDestinationPairKey: ancestorPairKey,
				nextScreenKey: "deep-route",
				linkId: "card",
				shouldRefresh: true,
				closing: false,
				entering: false,
				animating: false,
				progress: 1,
			}),
		).toBeNull();
	});
});
