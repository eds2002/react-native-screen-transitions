import { beforeEach, describe, expect, it } from "bun:test";
import { getInitialDestinationMeasurementSignal } from "../../components/boundary/utils/destination-signals";
import {
	isMeasurementInViewport,
	normalizeMeasuredBoundsToOrigin,
	normalizeMeasuredBoundsWithVisibilityGate,
} from "../../components/boundary/utils/measured-bounds";
import { getRefreshBoundarySignal } from "../../components/boundary/utils/refresh-signals";
import { getInitialSourceCaptureSignal } from "../../components/boundary/utils/source-signals";
import { BoundStore, type Snapshot } from "../../stores/bounds";
import {
	createPendingPairKey,
	createScreenPairKey,
} from "../../stores/bounds/helpers/link-pairs.helpers";
import { pairs } from "../../stores/bounds/internals/state";
import type { ScreenTransitionState } from "../../types/animation.types";
import { computeBoundStyles } from "../../utils/bounds/helpers/styles/compute";

const createBounds = (): Snapshot["bounds"] => ({
	x: 0,
	y: 0,
	pageX: 0,
	pageY: 0,
	width: 100,
	height: 100,
});

const createTransitionState = (screenKey: string) =>
	({
		route: {
			key: screenKey,
		},
	}) as ScreenTransitionState;

const requestBoundStyle = (
	id: string,
	target?: "fullscreen" | Snapshot["bounds"],
) =>
	computeBoundStyles(
		{
			id,
			current: createTransitionState("screen-a"),
			next: createTransitionState("screen-b"),
			progress: 0,
			dimensions: {
				width: 400,
				height: 800,
			},
			interpolationProps: {} as never,
		},
		{
			id,
			target,
		},
	);

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("bounds client measurement contract", () => {
	it("keeps destination startup gated until a registered pair is complete", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const getSignal = ({
			destinationPresent = true,
			sourcePresent = true,
		}: {
			destinationPresent?: boolean;
			sourcePresent?: boolean;
		} = {}) =>
			getInitialDestinationMeasurementSignal({
				enabled: true,
				destinationPairKey: pairKey,
				linkId: "card",
				destinationPresent,
				sourcePresent,
				linkState: pairs.get(),
			});

		expect(getSignal({ destinationPresent: false })).toEqual({
			pairKey,
			action: "wait",
		});
		expect(getSignal({ sourcePresent: false })).toEqual({
			pairKey,
			action: "release",
		});
		expect(getSignal()).toEqual({
			pairKey,
			action: "measure",
		});

		BoundStore.link.setDestination(
			pairKey,
			"card",
			"screen-b",
			createBounds(),
		);

		expect(getSignal()).toEqual({
			pairKey,
			action: "wait",
		});

		BoundStore.link.setSource(
			pairKey,
			"card",
			"screen-a",
			createBounds(),
		);

		expect(getSignal()).toEqual({ pairKey, action: "complete" });
	});

	it("auto source capture waits for destination then emits once", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		const measuredTargets: Array<{ type: "source"; pairKey: string }> = [];
		let lastSignal: string | null = null;

		const runAutoSourceReaction = () => {
			const captureSignal = getInitialSourceCaptureSignal({
				enabled: true,
				sourcePairKey: pairKey,
				linkId: "card",
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

	it("does not request source capture for normal bounds without destination", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		expect(requestBoundStyle("card")).toEqual({});
		expect(
			getInitialSourceCaptureSignal({
				enabled: true,
				sourcePairKey: pairKey,
				linkId: "card",
				linkState: pairs.get(),
			}),
		).toBeNull();
	});

	it("target-overridden bounds request source capture without destination", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		expect(requestBoundStyle("card", "fullscreen")).toEqual({});
		expect(
			getInitialSourceCaptureSignal({
				enabled: true,
				sourcePairKey: pairKey,
				linkId: "card",
				linkState: pairs.get(),
			}),
		).toEqual({
			pairKey,
			signal: "source|screen-a<>screen-b|card",
		});

		BoundStore.link.setSource(pairKey, "card", "screen-a", createBounds());

		expect(pairs.get()[pairKey].sourceRequests?.card).toBeUndefined();
		expect(
			getInitialSourceCaptureSignal({
				enabled: true,
				sourcePairKey: pairKey,
				linkId: "card",
				linkState: pairs.get(),
			}),
		).toBeNull();
	});

	it("custom target bounds request source capture without destination", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		expect(requestBoundStyle("card", createBounds())).toEqual({});
		expect(
			getInitialSourceCaptureSignal({
				enabled: true,
				sourcePairKey: pairKey,
				linkId: "card",
				linkState: pairs.get(),
			}),
		).toEqual({
			pairKey,
			signal: "source|screen-a<>screen-b|card",
		});
	});

	it("target-overridden grouped source requests still respect active group", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		BoundStore.link.setActiveGroupId(pairKey, "colors", "2");

		expect(requestBoundStyle("colors:1", "fullscreen")).toEqual({});
		expect(
			getInitialSourceCaptureSignal({
				enabled: true,
				sourcePairKey: pairKey,
				linkId: "1",
				group: "colors",
				linkState: pairs.get(),
			}),
		).toBeNull();

		expect(requestBoundStyle("colors:2", "fullscreen")).toEqual({});
		expect(
			getInitialSourceCaptureSignal({
				enabled: true,
				sourcePairKey: pairKey,
				linkId: "2",
				group: "colors",
				linkState: pairs.get(),
			}),
		).toEqual({
			pairKey,
			signal: "source|screen-a<>screen-b|colors|2",
		});
	});

	it("source capture rewrites the same pair-local link", () => {
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

	it("releases inactive grouped destinations after the active id is established", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");
		BoundStore.link.setDestination(
			pairKey,
			"lime",
			"screen-b",
			createBounds(),
			{},
			"colors",
		);

		const getSignal = (linkId: string) =>
			getInitialDestinationMeasurementSignal({
				enabled: true,
				destinationPairKey: pairKey,
				linkId,
				group: "colors",
				destinationPresent: true,
				sourcePresent: true,
				linkState: pairs.get(),
			});

		expect(getSignal("lime")).toEqual({ pairKey, action: "wait" });
		expect(getSignal("sky")).toEqual({ pairKey, action: "release" });
		expect(getSignal("electric")).toEqual({ pairKey, action: "release" });
	});

	it("attaches nested initial destinations to the nearest ancestor pair", () => {
		const ancestorPairKey = createScreenPairKey("screen-a", "nested-route");

		const getSignal = () =>
			getInitialDestinationMeasurementSignal({
				enabled: true,
				ancestorDestinationPairKey: ancestorPairKey,
				linkId: "card",
				destinationPresent: true,
				sourcePresent: true,
				linkState: pairs.get(),
			});

		expect(getSignal()).toEqual({
			pairKey: ancestorPairKey,
			action: "measure",
		});

		BoundStore.link.setDestination(
			ancestorPairKey,
			"card",
			"nested-index",
			createBounds(),
		);

		expect(getSignal()).toEqual({
			pairKey: ancestorPairKey,
			action: "wait",
		});
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

	it("normalizes measured bounds against the screen origin", () => {
		const blockedMeasurement = {
			...createBounds(),
			pageX: 420,
			pageY: 1749,
		};
		const origin = {
			...createBounds(),
			pageX: 402,
			pageY: 1749,
		};

		const normalized = normalizeMeasuredBoundsToOrigin(
			blockedMeasurement,
			origin,
		);

		expect(normalized.pageX).toBe(18);
		expect(normalized.pageY).toBe(0);
		expect(normalized.x).toBe(blockedMeasurement.x);
		expect(normalized.y).toBe(blockedMeasurement.y);
		expect(isMeasurementInViewport(normalized, 400, 800)).toBe(true);
	});

	it("corrects visibility-gate frame skew while the screen is offset", () => {
		const visibilityBlockOffset = 1601;
		const destination = {
			...createBounds(),
			pageX: 18,
			pageY: 1749,
		};
		const staleOrigin = {
			...createBounds(),
			pageY: 0,
		};
		const normalize = (
			measured: Snapshot["bounds"],
			origin: Snapshot["bounds"],
		) =>
			normalizeMeasuredBoundsWithVisibilityGate({
				measured,
				origin,
				visibilityBlocked: true,
				visibilityBlockOffset,
				viewportWidth: 400,
				viewportHeight: 800,
			});

		expect(
			normalize(destination, {
				...staleOrigin,
				pageY: visibilityBlockOffset,
			}),
		).toMatchObject({ pageX: 18, pageY: 148 });

		expect(normalize(destination, staleOrigin)).toMatchObject({
			pageX: 18,
			pageY: 148,
		});

		expect(
			normalize(
				{ ...destination, pageY: 148 },
				{ ...staleOrigin, pageY: visibilityBlockOffset },
			),
		).toMatchObject({ pageX: 18, pageY: 148 });
	});

	it("does not reinterpret offscreen measurements after visibility opens", () => {
		const measured = {
			...createBounds(),
			pageY: 1749,
		};

		expect(
			normalizeMeasuredBoundsWithVisibilityGate({
				measured,
				origin: createBounds(),
				visibilityBlocked: false,
				visibilityBlockOffset: 1601,
				viewportWidth: 400,
				viewportHeight: 800,
			}),
		).toMatchObject({ pageY: 1749 });
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

		const getSignal = (linkId: string, gestureInProgress = false) =>
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
				gestureInProgress,
				linkState: pairs.get(),
			});

		expect(getSignal("1")).toBeNull();
		expect(getSignal("2", true)).toBeNull();
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
				gestureInProgress: false,
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
				gestureInProgress: false,
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
				gestureInProgress: false,
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
				gestureInProgress: false,
			}),
		).toBeNull();
	});
});
