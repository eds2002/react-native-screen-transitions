import { beforeEach, describe, expect, it } from "bun:test";
import { makeMutable } from "react-native-reanimated";
import { createScreenPairKey } from "../../stores/bounds/helpers/link-pairs.helpers";
import { applyMeasuredBoundsWrites } from "../../providers/helpers/measured-bounds-writes";
import {
	abandonBoundaryMeasurement,
	getBoundaryMeasurementRequest,
	markBoundaryPortalReady,
	registerBoundary,
	registerScreen,
	requestBoundaryMeasurements,
	unregisterBoundary,
	unregisterScreen,
} from "../../stores/bounds/internals/coordinator";
import { boundaryRegistry, pairs } from "../../stores/bounds/internals/state";

const registerTree = () => {
	registerScreen({
		screenKey: "source-root",
		animationProgress: makeMutable(1),
		pendingLifecycleStartBlockCount: makeMutable(0),
	});
	registerScreen({
		screenKey: "source-level-1",
		parentScreenKey: "source-root",
		animationProgress: makeMutable(1),
		pendingLifecycleStartBlockCount: makeMutable(0),
	});
	registerScreen({
		screenKey: "source-level-2",
		parentScreenKey: "source-level-1",
		animationProgress: makeMutable(1),
		pendingLifecycleStartBlockCount: makeMutable(0),
	});
	registerScreen({
		screenKey: "source-leaf",
		parentScreenKey: "source-level-2",
		animationProgress: makeMutable(1),
		pendingLifecycleStartBlockCount: makeMutable(0),
	});

	registerScreen({
		screenKey: "destination-root",
		animationProgress: makeMutable(0),
		pendingLifecycleStartBlockCount: makeMutable(0),
	});
	registerScreen({
		screenKey: "destination-level-1",
		parentScreenKey: "destination-root",
		animationProgress: makeMutable(1),
		pendingLifecycleStartBlockCount: makeMutable(0),
	});
	registerScreen({
		screenKey: "destination-level-2",
		parentScreenKey: "destination-level-1",
		animationProgress: makeMutable(1),
		pendingLifecycleStartBlockCount: makeMutable(0),
	});
	registerScreen({
		screenKey: "destination-leaf",
		parentScreenKey: "destination-level-2",
		animationProgress: makeMutable(1),
		pendingLifecycleStartBlockCount: makeMutable(0),
	});
};

const measured = {
	x: 10,
	y: 20,
	pageX: 10,
	pageY: 20,
	width: 100,
	height: 80,
};

const registerPair = (escapeClipping = false) => {
	const blockCount = makeMutable(0);
	registerScreen({
		screenKey: "source",
		animationProgress: makeMutable(1),
		pendingLifecycleStartBlockCount: makeMutable(0),
	});
	registerScreen({
		screenKey: "destination",
		animationProgress: makeMutable(0),
		pendingLifecycleStartBlockCount: blockCount,
	});
	registerBoundary({
		boundTag: { tag: "card", linkKey: "card" },
		screenKey: "source",
		entry: escapeClipping ? { escapeClipping: true } : {},
	});
	registerBoundary({
		boundTag: { tag: "card", linkKey: "card" },
		screenKey: "destination",
		entry: {},
	});

	return {
		blockCount,
		pairKey: createScreenPairKey("source", "destination"),
	};
};

const measurePairSide = (
	pairKey: string,
	type: "source" | "destination",
	escapeClipping = false,
) => {
	applyMeasuredBoundsWrites({
		entryTag: "card",
		linkId: "card",
		currentScreenKey: type,
		measured,
		preparedStyles: {},
		linkWrite: { type, pairKey },
		escapeClipping,
	});
};

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("bounds coordinator", () => {
	it("registers boundaries without measuring or creating a link", () => {
		registerScreen({
			screenKey: "screen-a",
			animationProgress: makeMutable(1),
			pendingLifecycleStartBlockCount: makeMutable(0),
		});

		registerBoundary({
			boundTag: { tag: "card", linkKey: "card" },
			screenKey: "screen-a",
			entry: {},
		});

		expect(boundaryRegistry.get().card?.screens["screen-a"]?.bounds).toBeNull();
		expect(pairs.get()).toEqual({});
	});

	it("routes one demand to deeply nested source and destination leaves", () => {
		registerTree();
		registerBoundary({
			boundTag: { tag: "card", linkKey: "card" },
			screenKey: "source-leaf",
			entry: {},
		});
		registerBoundary({
			boundTag: { tag: "card", linkKey: "card" },
			screenKey: "destination-leaf",
			entry: {},
		});

		const pairKey = createScreenPairKey("source-root", "destination-root");
		requestBoundaryMeasurements({
			pairKey,
			tag: "card",
			destination: true,
			refresh: false,
		});

		expect(getBoundaryMeasurementRequest("card", "source-leaf")).toEqual({
			type: "source",
			pairKey,
		});
		expect(
			getBoundaryMeasurementRequest("card", "destination-leaf"),
		).toEqual({ type: "destination", pairKey });
	});

	it("does not route a sibling transition through an unrelated branch", () => {
		registerTree();
		registerScreen({
			screenKey: "unrelated-root",
			animationProgress: makeMutable(1),
			pendingLifecycleStartBlockCount: makeMutable(0),
		});
		registerScreen({
			screenKey: "unrelated-leaf",
			parentScreenKey: "unrelated-root",
			animationProgress: makeMutable(1),
			pendingLifecycleStartBlockCount: makeMutable(0),
		});
		registerBoundary({
			boundTag: { tag: "card", linkKey: "card" },
			screenKey: "unrelated-leaf",
			entry: {},
		});

		requestBoundaryMeasurements({
			pairKey: createScreenPairKey("source-root", "destination-root"),
			tag: "card",
			destination: true,
			refresh: false,
		});

		expect(getBoundaryMeasurementRequest("card", "unrelated-leaf")).toBeNull();
	});

	it("retargets a group only when the interpolator requests a new member", () => {
		registerTree();
		const pairKey = createScreenPairKey("source-root", "destination-root");
		registerBoundary({
			boundTag: { tag: "colors:violet", linkKey: "violet", group: "colors" },
			screenKey: "source-leaf",
			entry: {},
		});
		registerBoundary({
			boundTag: { tag: "colors:coral", linkKey: "coral", group: "colors" },
			screenKey: "source-level-2",
			entry: {},
		});

		requestBoundaryMeasurements({
			pairKey,
			tag: "colors:violet",
			destination: true,
			refresh: false,
		});
		registerBoundary({
			boundTag: { tag: "colors:coral", linkKey: "coral", group: "colors" },
			screenKey: "destination-leaf",
			entry: {},
		});

		expect(pairs.get()[pairKey]?.groups.colors?.activeId).toBe("violet");
		expect(
			getBoundaryMeasurementRequest("colors:coral", "source-level-2"),
		).toBeNull();

		requestBoundaryMeasurements({
			pairKey,
			tag: "colors:coral",
			destination: true,
			refresh: false,
		});

		expect(pairs.get()[pairKey]?.groups.colors?.activeId).toBe("coral");
		expect(
			getBoundaryMeasurementRequest("colors:coral", "source-level-2"),
		).toEqual({ type: "source", pairKey });
		expect(
			getBoundaryMeasurementRequest("colors:coral", "destination-leaf"),
		).toEqual({ type: "destination", pairKey });
	});

	it("does not let already-mounted destination members override the requested id", () => {
		registerTree();
		registerBoundary({
			boundTag: { tag: "colors:violet", linkKey: "violet", group: "colors" },
			screenKey: "source-leaf",
			entry: {},
		});
		registerBoundary({
			boundTag: { tag: "colors:coral", linkKey: "coral", group: "colors" },
			screenKey: "source-level-2",
			entry: {},
		});
		registerBoundary({
			boundTag: { tag: "colors:coral", linkKey: "coral", group: "colors" },
			screenKey: "destination-leaf",
			entry: {},
		});
		registerBoundary({
			boundTag: {
				tag: "colors:violet",
				linkKey: "violet",
				group: "colors",
			},
			screenKey: "destination-leaf",
			entry: {},
		});
		const pairKey = createScreenPairKey("source-root", "destination-root");

		requestBoundaryMeasurements({
			pairKey,
			tag: "colors:violet",
			destination: true,
			refresh: false,
		});

		expect(pairs.get()[pairKey]?.groups.colors?.activeId).toBe("violet");
		expect(pairs.get()[pairKey]?.blockedDestinations?.violet).toBe(true);
		expect(
			getBoundaryMeasurementRequest("colors:violet", "source-leaf"),
		).toEqual({ type: "source", pairKey });
		expect(
			getBoundaryMeasurementRequest("colors:coral", "source-level-2"),
		).toBeNull();
	});

	it("releases a destination lifecycle block when its request is abandoned", () => {
		const blockCount = makeMutable(0);
		registerScreen({
			screenKey: "source",
			animationProgress: makeMutable(1),
			pendingLifecycleStartBlockCount: makeMutable(0),
		});
		registerScreen({
			screenKey: "destination",
			animationProgress: makeMutable(0),
			pendingLifecycleStartBlockCount: blockCount,
		});
		registerBoundary({
			boundTag: { tag: "card", linkKey: "card" },
			screenKey: "source",
			entry: {},
		});
		registerBoundary({
			boundTag: { tag: "card", linkKey: "card" },
			screenKey: "destination",
			entry: {},
		});
		const pairKey = createScreenPairKey("source", "destination");

		requestBoundaryMeasurements({
			pairKey,
			tag: "card",
			destination: true,
			refresh: false,
		});
		expect(blockCount.get()).toBe(1);

		abandonBoundaryMeasurement({
			type: "destination",
			pairKey,
			tag: "card",
		});
		expect(blockCount.get()).toBe(0);
	});

	it("releases a destination lifecycle block when its source gives up", () => {
		const blockCount = makeMutable(0);
		registerScreen({
			screenKey: "source",
			animationProgress: makeMutable(1),
			pendingLifecycleStartBlockCount: makeMutable(0),
		});
		registerScreen({
			screenKey: "destination",
			animationProgress: makeMutable(0),
			pendingLifecycleStartBlockCount: blockCount,
		});
		registerBoundary({
			boundTag: { tag: "card", linkKey: "card" },
			screenKey: "source",
			entry: {},
		});
		registerBoundary({
			boundTag: { tag: "card", linkKey: "card" },
			screenKey: "destination",
			entry: {},
		});
		const pairKey = createScreenPairKey("source", "destination");

		requestBoundaryMeasurements({
			pairKey,
			tag: "card",
			destination: true,
			refresh: false,
		});
		expect(blockCount.get()).toBe(1);

		unregisterBoundary({ tag: "card", linkKey: "card" }, "source");
		expect(blockCount.get()).toBe(0);
	});

	it("does not rewrite a completed pair when its boundary unmounts", () => {
		const { pairKey } = registerPair();
		requestBoundaryMeasurements({
			pairKey,
			tag: "card",
			destination: true,
			refresh: false,
		});
		measurePairSide(pairKey, "destination");
		measurePairSide(pairKey, "source");

		const originalModify = pairs.modify;
		let pairWrites = 0;
		(pairs as any).modify = (...args: Parameters<typeof pairs.modify>) => {
			pairWrites += 1;
			return originalModify.apply(pairs, args);
		};

		try {
			unregisterBoundary(
				{ tag: "card", linkKey: "card" },
				"destination",
			);
			expect(pairWrites).toBe(0);
		} finally {
			(pairs as any).modify = originalModify;
		}
	});

	it("does not rewrite a blocked pair after its screen unregisters", () => {
		const { pairKey } = registerPair();
		requestBoundaryMeasurements({
			pairKey,
			tag: "card",
			destination: true,
			refresh: false,
		});
		unregisterScreen("destination");

		const originalModify = pairs.modify;
		let pairWrites = 0;
		(pairs as any).modify = (...args: Parameters<typeof pairs.modify>) => {
			pairWrites += 1;
			return originalModify.apply(pairs, args);
		};

		try {
			unregisterBoundary(
				{ tag: "card", linkKey: "card" },
				"destination",
			);
			expect(pairWrites).toBe(0);
		} finally {
			(pairs as any).modify = originalModify;
		}
	});

	it("holds the opening gate until both demanded sides have measured", () => {
		const blockCount = makeMutable(0);
		registerScreen({
			screenKey: "source",
			animationProgress: makeMutable(1),
			pendingLifecycleStartBlockCount: makeMutable(0),
		});
		registerScreen({
			screenKey: "destination",
			animationProgress: makeMutable(0),
			pendingLifecycleStartBlockCount: blockCount,
		});
		registerBoundary({
			boundTag: { tag: "card", linkKey: "card" },
			screenKey: "source",
			entry: {},
		});
		registerBoundary({
			boundTag: { tag: "card", linkKey: "card" },
			screenKey: "destination",
			entry: {},
		});
		const pairKey = createScreenPairKey("source", "destination");
		requestBoundaryMeasurements({
			pairKey,
			tag: "card",
			destination: true,
			refresh: false,
		});

		applyMeasuredBoundsWrites({
			entryTag: "card",
			linkId: "card",
			currentScreenKey: "destination",
			measured,
			preparedStyles: {},
			linkWrite: { type: "destination", pairKey },
		});
		expect(blockCount.get()).toBe(1);

		applyMeasuredBoundsWrites({
			entryTag: "card",
			linkId: "card",
			currentScreenKey: "source",
			measured,
			preparedStyles: {},
			linkWrite: { type: "source", pairKey },
		});
		expect(blockCount.get()).toBe(0);
		expect(pairs.get()[pairKey]?.links.card?.status).toBe("complete");
	});

	it("holds an escape-clipping opening until its source portal is ready", () => {
		const { blockCount, pairKey } = registerPair(true);
		requestBoundaryMeasurements({
			pairKey,
			tag: "card",
			destination: true,
			refresh: false,
		});

		measurePairSide(pairKey, "destination");
		measurePairSide(pairKey, "source", true);

		expect(blockCount.get()).toBe(1);
		markBoundaryPortalReady(pairKey, "card");
		expect(blockCount.get()).toBe(0);
	});

	it("releases once the destination completes when the portal was ready first", () => {
		const { blockCount, pairKey } = registerPair(true);
		requestBoundaryMeasurements({
			pairKey,
			tag: "card",
			destination: true,
			refresh: false,
		});

		measurePairSide(pairKey, "source", true);
		markBoundaryPortalReady(pairKey, "card");
		expect(blockCount.get()).toBe(1);

		measurePairSide(pairKey, "destination");
		expect(blockCount.get()).toBe(0);
	});

	it("requires fresh portal readiness for a refreshed escape-clipping link", () => {
		const { blockCount, pairKey } = registerPair(true);

		requestBoundaryMeasurements({
			pairKey,
			tag: "card",
			destination: true,
			refresh: false,
		});
		measurePairSide(pairKey, "source", true);
		measurePairSide(pairKey, "destination");
		markBoundaryPortalReady(pairKey, "card");
		expect(blockCount.get()).toBe(0);

		requestBoundaryMeasurements({
			pairKey,
			tag: "card",
			destination: true,
			refresh: true,
		});
		expect(blockCount.get()).toBe(1);

		measurePairSide(pairKey, "source", true);
		measurePairSide(pairKey, "destination");
		expect(blockCount.get()).toBe(1);

		markBoundaryPortalReady(pairKey, "card");
		expect(blockCount.get()).toBe(0);
	});
});
