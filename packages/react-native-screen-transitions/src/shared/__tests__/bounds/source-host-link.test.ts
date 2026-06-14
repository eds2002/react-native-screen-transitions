import { beforeEach, describe, expect, it } from "bun:test";
import { BoundStore, type Snapshot } from "../../stores/bounds";
import {
	createPendingPairKey,
	createScreenPairKey,
} from "../../stores/bounds/helpers/link-pairs.helpers";
import type { SourceHostRef } from "../../stores/bounds/types";
import { computeBoundStyles } from "../../utils/bounds/helpers/styles/compute";

const SCROLL_HOST: SourceHostRef = {
	hostKey: "screen-a-host-1",
	capturesScroll: true,
};

const createBounds = (
	x = 0,
	y = 0,
	width = 100,
	height = 100,
): Snapshot["bounds"] => ({
	x,
	y,
	pageX: x,
	pageY: y,
	width,
	height,
});

const createScrollLayout = (x = 0, y = 0) => ({
	vertical: { offset: y, contentSize: 1000, layoutSize: 400 },
	horizontal: { offset: x, contentSize: 1000, layoutSize: 400 },
	isTouched: false,
});

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("source host link metadata", () => {
	it("stores the source host and exposes it through the resolver", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		BoundStore.link.setSource(
			pairKey,
			"card",
			"screen-a",
			createBounds(0, 0),
			{},
			undefined,
			"matched-screen",
			SCROLL_HOST,
		);
		BoundStore.link.setDestination(pairKey, "card", "screen-b", createBounds());

		expect(BoundStore.link.getSource(pairKey, "card")?.sourceHost).toEqual(
			SCROLL_HOST,
		);
		expect(
			BoundStore.link.getPair("card", {
				entering: true,
				previousScreenKey: "screen-a",
				currentScreenKey: "screen-b",
			}).sourceHost,
		).toEqual(SCROLL_HOST);
	});

	it("persists the source host across refreshes without host context", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		BoundStore.link.setSource(
			pairKey,
			"card",
			"screen-a",
			createBounds(0, 0),
			{},
			undefined,
			"matched-screen",
			SCROLL_HOST,
		);
		// Refresh paths (e.g. provider-driven re-measures) omit portal context.
		BoundStore.link.setSource(pairKey, "card", "screen-a", createBounds(0, 4));

		expect(BoundStore.link.getSource(pairKey, "card")?.sourceHost).toEqual(
			SCROLL_HOST,
		);
	});

	it("carries the source host through pending pair promotion", () => {
		const pendingPairKey = createPendingPairKey("screen-a");
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		// Press-driven sources land in the pending pair before navigation; the
		// first destination write promotes them into the concrete pair.
		BoundStore.link.setSource(
			pendingPairKey,
			"card",
			"screen-a",
			createBounds(0, 0),
			{},
			undefined,
			"matched-screen",
			SCROLL_HOST,
		);
		BoundStore.link.setDestination(pairKey, "card", "screen-b", createBounds());

		expect(BoundStore.link.getSource(pairKey, "card")?.sourceHost).toEqual(
			SCROLL_HOST,
		);
	});

	it("keeps source hosts independent per group member", () => {
		const pairKey = createScreenPairKey("screen-a", "screen-b");

		BoundStore.link.setSource(
			pairKey,
			"items:1",
			"screen-a",
			createBounds(0, 0),
			{},
			"items",
			"matched-screen",
			SCROLL_HOST,
		);
		BoundStore.link.setSource(
			pairKey,
			"items:2",
			"screen-a",
			createBounds(0, 100),
			{},
			"items",
			"matched-screen",
		);

		expect(BoundStore.link.getSource(pairKey, "items:1")?.sourceHost).toEqual(
			SCROLL_HOST,
		);
		expect(
			BoundStore.link.getSource(pairKey, "items:2")?.sourceHost,
		).toBeUndefined();
	});
});

describe("teleported source scroll shift", () => {
	const pairKey = createScreenPairKey("screen-a", "screen-b");

	const registerLink = (
		tag: string,
		sourceY: number,
		options: {
			portalAttachTarget?: "matched-screen";
			sourceHost?: SourceHostRef;
			sourceScroll?: ReturnType<typeof createScrollLayout>;
		} = {},
	) => {
		const sourceBounds = options.sourceScroll
			? ({
					...createBounds(0, sourceY, 100, 80),
					scroll: options.sourceScroll,
				} as Snapshot["bounds"])
			: createBounds(0, sourceY, 100, 80);

		BoundStore.link.setSource(
			pairKey,
			tag,
			"screen-a",
			sourceBounds,
			{},
			undefined,
			options.portalAttachTarget,
			options.sourceHost,
		);
		BoundStore.link.setDestination(
			pairKey,
			tag,
			"screen-b",
			// Destination snapshot matches the live next scroll below, so the
			// destination shift is zero and the source shift is isolated.
			{
				...createBounds(120, 300, 200, 150),
				scroll: createScrollLayout(0, 100),
			} as Snapshot["bounds"],
		);
	};

	const computeFor = (tag: string) =>
		computeBoundStyles(
			{
				id: tag,
				current: {
					route: { key: "screen-a" },
					// Live source scroll: travelled 150 since the captured 100.
					layouts: { scroll: createScrollLayout(0, 250) },
				},
				next: {
					route: { key: "screen-b" },
					layouts: { scroll: createScrollLayout(0, 100) },
				},
				progress: 1.4,
				dimensions: { width: 400, height: 800 },
			} as any,
			{ id: tag },
		);

	it("shifts the start rect by the clamped source scroll travel", () => {
		registerLink("teleported", 200, {
			portalAttachTarget: "matched-screen",
			sourceHost: SCROLL_HOST,
			sourceScroll: createScrollLayout(0, 100),
		});
		// Control: classic link whose source already sits at the shifted spot.
		registerLink("control", 50);

		expect(computeFor("teleported")).toEqual(computeFor("control"));
	});

	it("does not shift without a scroll-scoped source host", () => {
		registerLink("teleported-root-source", 200, {
			portalAttachTarget: "matched-screen",
			sourceScroll: createScrollLayout(0, 100),
		});
		registerLink("control", 200);

		expect(computeFor("teleported-root-source")).toEqual(
			computeFor("control"),
		);
	});
});
