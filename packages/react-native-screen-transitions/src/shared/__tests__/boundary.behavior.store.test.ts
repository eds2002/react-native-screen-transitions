import { beforeEach, describe, expect, it } from "bun:test";
import { BoundStore } from "../stores/bounds";
import {
	createBounds,
	expectResolvedPair,
	makeContext,
	makeTag,
	registerSourceAndDestination,
} from "./helpers/bounds-behavior-fixtures";

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("Store Contract", () => {
	it("registers snapshot for a tag and screen, then updates it on re-measure", () => {
		const tag = makeTag("card");
		const initial = createBounds(0, 0, 100, 100);
		const updated = createBounds(20, 30, 140, 160);

		BoundStore.registerSnapshot(tag, "screen-a", initial, { opacity: 0.7 });
		BoundStore.registerSnapshot(tag, "screen-a", updated, { opacity: 1 });

		const snapshot = BoundStore.getSnapshot(tag, "screen-a");
		expect(snapshot?.bounds).toEqual(updated);
		expect(snapshot?.styles).toEqual({ opacity: 1 });
	});

	it("sets source link and creates a pending destination", () => {
		const tag = makeTag("card");
		const sourceBounds = createBounds(10, 20, 100, 120);

		BoundStore.setLinkSource(tag, "screen-a", sourceBounds);

		const latest = BoundStore.getActiveLink(tag);
		expect(latest?.source.screenKey).toBe("screen-a");
		expect(latest?.source.bounds).toEqual(sourceBounds);
		expect(latest?.destination).toBeNull();
		expect(BoundStore.hasPendingLink(tag)).toBe(true);
		expect(BoundStore.getLatestPendingSourceScreenKey(tag)).toBe("screen-a");
	});

	it("coalesces duplicate pending source writes for the same screen family", () => {
		const tag = makeTag("card");
		const first = createBounds(0, 0, 100, 100);
		const second = createBounds(30, 40, 130, 130);

		BoundStore.setLinkSource(tag, "screen-a", first);
		BoundStore.setLinkSource(tag, "screen-a", second);
		BoundStore.setLinkDestination(tag, "screen-b", createBounds(200, 220));

		const linked = BoundStore.getActiveLink(tag, "screen-b");
		expect(linked?.source.screenKey).toBe("screen-a");
		expect(linked?.source.bounds).toEqual(second);
		expect(BoundStore.hasPendingLink(tag)).toBe(false);
	});

	it("sets destination on the latest pending link", () => {
		const tag = makeTag("card");

		BoundStore.setLinkSource(tag, "screen-a", createBounds(0, 0, 90, 90));
		BoundStore.setLinkSource(tag, "screen-b", createBounds(10, 10, 110, 110));
		BoundStore.setLinkDestination(tag, "screen-detail", createBounds(200, 200));

		const detailLink = BoundStore.getActiveLink(tag, "screen-detail");
		expect(detailLink?.source.screenKey).toBe("screen-b");
		expect(detailLink?.destination?.screenKey).toBe("screen-detail");
		expect(BoundStore.hasPendingLinkFromSource(tag, "screen-a")).toBe(true);
	});

	it("targets pending destination by expected source screen", () => {
		const tag = makeTag("card");

		BoundStore.setLinkSource(tag, "screen-a", createBounds(0, 0, 90, 90));
		BoundStore.setLinkSource(tag, "screen-b", createBounds(10, 10, 110, 110));

		BoundStore.setLinkDestination(
			tag,
			"screen-detail",
			createBounds(220, 220),
			{},
			undefined,
			"screen-a",
		);

		const detailLink = BoundStore.getActiveLink(tag, "screen-detail");
		expect(detailLink?.source.screenKey).toBe("screen-a");
		expect(BoundStore.hasPendingLinkFromSource(tag, "screen-b")).toBe(true);
	});

	it("updates source on newest matching completed link, otherwise matching pending link", () => {
		const tag = makeTag("card");

		BoundStore.setLinkSource(tag, "screen-a", createBounds(0, 0, 100, 100));
		BoundStore.setLinkDestination(tag, "screen-detail", createBounds(200, 200));
		BoundStore.setLinkSource(tag, "screen-a", createBounds(20, 20, 120, 120));

		const completedUpdate = createBounds(50, 60, 150, 160);
		BoundStore.updateLinkSource(tag, "screen-a", completedUpdate);

		const completedLink = BoundStore.getActiveLink(tag, "screen-detail");
		const latestLink = BoundStore.getActiveLink(tag);
		expect(completedLink?.source.bounds).toEqual(completedUpdate);
		expect(latestLink?.destination).toBeNull();

		const fallbackTag = makeTag("card-fallback");
		const pendingUpdate = createBounds(15, 25, 115, 125);
		BoundStore.setLinkSource(fallbackTag, "screen-x", createBounds(5, 5, 95, 95));
		BoundStore.updateLinkSource(fallbackTag, "screen-x", pendingUpdate);
		expect(BoundStore.getActiveLink(fallbackTag)?.source.bounds).toEqual(
			pendingUpdate,
		);
	});

	it("updates destination on newest matching completed link, otherwise pending fallback", () => {
		const tag = makeTag("card");
		const updatedDestination = createBounds(300, 320, 210, 220);

		BoundStore.setLinkSource(tag, "screen-a", createBounds(0, 0, 100, 100));
		BoundStore.setLinkDestination(tag, "screen-detail", createBounds(200, 200));
		BoundStore.setLinkSource(tag, "screen-a", createBounds(20, 20, 120, 120));
		BoundStore.updateLinkDestination(tag, "screen-detail", updatedDestination);

		expect(BoundStore.getActiveLink(tag, "screen-detail")?.destination?.bounds).toEqual(
			updatedDestination,
		);

		const fallbackTag = makeTag("card-fallback");
		BoundStore.setLinkSource(fallbackTag, "screen-source", createBounds(8, 8));
		BoundStore.updateLinkDestination(
			fallbackTag,
			"screen-detail-fallback",
			createBounds(240, 260),
			{},
			undefined,
			"screen-source",
		);
		expect(
			BoundStore.getActiveLink(fallbackTag)?.destination?.screenKey,
		).toBe("screen-detail-fallback");
	});

	it("resolves entering pair with destination-first priority", () => {
		const tag = makeTag("card");

		registerSourceAndDestination({
			tag,
			sourceScreenKey: "screen-match-source",
			destinationScreenKey: "screen-current",
			sourceBounds: createBounds(0, 0, 100, 100),
			destinationBounds: createBounds(200, 200, 180, 180),
		});
		registerSourceAndDestination({
			tag,
			sourceScreenKey: "screen-prev",
			destinationScreenKey: "screen-other",
			sourceBounds: createBounds(10, 10, 120, 120),
			destinationBounds: createBounds(300, 300, 160, 160),
		});

		const pair = BoundStore.resolveTransitionPair(
			tag,
			makeContext({
				entering: true,
				currentScreenKey: "screen-current",
				previousScreenKey: "screen-prev",
				nextScreenKey: "screen-next",
			}),
		);

		expectResolvedPair(pair, {
			sourceScreenKey: "screen-match-source",
			destinationScreenKey: "screen-current",
			usedPending: false,
		});
	});

	it("resolves exiting pair with source-first priority", () => {
		const tag = makeTag("card");

		registerSourceAndDestination({
			tag,
			sourceScreenKey: "screen-current",
			destinationScreenKey: "screen-detail",
		});
		registerSourceAndDestination({
			tag,
			sourceScreenKey: "screen-other",
			destinationScreenKey: "screen-next",
		});

		const pair = BoundStore.resolveTransitionPair(
			tag,
			makeContext({
				entering: false,
				currentScreenKey: "screen-current",
				nextScreenKey: "screen-next",
			}),
		);

		expectResolvedPair(pair, {
			sourceScreenKey: "screen-current",
			destinationScreenKey: "screen-detail",
			usedPending: false,
		});
	});

	it("falls back to snapshots when a complete link pair is unavailable", () => {
		const tag = makeTag("card");
		const sourceSnapshotBounds = createBounds(10, 10, 100, 100);
		const destinationSnapshotBounds = createBounds(300, 300, 140, 140);

		BoundStore.registerSnapshot(tag, "screen-prev", sourceSnapshotBounds);
		BoundStore.registerSnapshot(tag, "screen-current", destinationSnapshotBounds);

		const pair = BoundStore.resolveTransitionPair(
			tag,
			makeContext({
				entering: true,
				previousScreenKey: "screen-prev",
				currentScreenKey: "screen-current",
			}),
		);

		expectResolvedPair(pair, {
			sourceScreenKey: "screen-prev",
			destinationScreenKey: "screen-current",
			sourceBounds: sourceSnapshotBounds,
			destinationBounds: destinationSnapshotBounds,
			usedSnapshotSource: true,
			usedSnapshotDestination: true,
		});
	});

	it("tracks presence counts and removes only when duplicate count reaches zero", () => {
		const tag = makeTag("card");

		BoundStore.registerBoundaryPresence(tag, "screen-a");
		BoundStore.registerBoundaryPresence(tag, "screen-a");
		expect(BoundStore.hasBoundaryPresence(tag, "screen-a")).toBe(true);

		BoundStore.unregisterBoundaryPresence(tag, "screen-a");
		expect(BoundStore.hasBoundaryPresence(tag, "screen-a")).toBe(true);

		BoundStore.unregisterBoundaryPresence(tag, "screen-a");
		expect(BoundStore.hasBoundaryPresence(tag, "screen-a")).toBe(false);
	});

	it("stores boundary config and resolves it by direct and ancestor key", () => {
		const tag = makeTag("card");
		const config = {
			anchor: "top" as const,
			scaleMode: "uniform" as const,
			method: "transform" as const,
		};

		BoundStore.registerBoundaryPresence(tag, "screen-a", ["stack-a"], config);

		expect(BoundStore.getBoundaryConfig(tag, "screen-a")).toEqual(config);
		expect(BoundStore.getBoundaryConfig(tag, "stack-a")).toEqual(config);
	});

	it("clear removes exact-screen snapshots, links, and presence", () => {
		const tag = makeTag("card");

		BoundStore.registerSnapshot(tag, "screen-a", createBounds(0, 0, 100, 100));
		BoundStore.registerSnapshot(tag, "screen-b", createBounds(20, 20, 110, 110));
		registerSourceAndDestination({
			tag,
			sourceScreenKey: "screen-a",
			destinationScreenKey: "screen-detail-a",
		});
		BoundStore.registerBoundaryPresence(tag, "screen-a");
		BoundStore.registerBoundaryPresence(tag, "screen-b");

		BoundStore.clear("screen-a");

		expect(BoundStore.getSnapshot(tag, "screen-a")).toBeNull();
		expect(BoundStore.hasSourceLink(tag, "screen-a")).toBe(false);
		expect(BoundStore.hasBoundaryPresence(tag, "screen-a")).toBe(false);
		expect(BoundStore.getSnapshot(tag, "screen-b")).not.toBeNull();
		expect(BoundStore.hasBoundaryPresence(tag, "screen-b")).toBe(true);
	});

	it("clearByAncestor removes ancestor-related snapshots, links, and presence", () => {
		const tag = makeTag("card");

		BoundStore.registerSnapshot(
			tag,
			"screen-child",
			createBounds(0, 0, 100, 100),
			{},
			["stack-a"],
		);
		BoundStore.registerSnapshot(
			tag,
			"screen-keep",
			createBounds(20, 20, 110, 110),
			{},
			["stack-b"],
		);
		registerSourceAndDestination({
			tag,
			sourceScreenKey: "screen-child",
			destinationScreenKey: "screen-detail",
			sourceAncestorKeys: ["stack-a"],
		});
		BoundStore.registerBoundaryPresence(tag, "screen-child", ["stack-a"]);
		BoundStore.registerBoundaryPresence(tag, "screen-keep", ["stack-b"]);

		BoundStore.clearByAncestor("stack-a");

		expect(BoundStore.getSnapshot(tag, "stack-a")).toBeNull();
		expect(BoundStore.hasSourceLink(tag, "stack-a")).toBe(false);
		expect(BoundStore.hasBoundaryPresence(tag, "stack-a")).toBe(false);
		expect(BoundStore.getSnapshot(tag, "screen-keep")).not.toBeNull();
		expect(BoundStore.hasBoundaryPresence(tag, "stack-b")).toBe(true);
	});

	it("clearByBranch removes navigator-branch snapshots, links, and presence", () => {
		const tag = makeTag("card");

		BoundStore.registerSnapshot(
			tag,
			"screen-a",
			createBounds(0, 0, 100, 100),
			{},
			undefined,
			"nav-a",
		);
		BoundStore.registerSnapshot(
			tag,
			"screen-b",
			createBounds(20, 20, 110, 110),
			{},
			undefined,
			"nav-b",
		);
		registerSourceAndDestination({
			tag,
			sourceScreenKey: "screen-a",
			destinationScreenKey: "detail-a",
			sourceNavigatorKey: "nav-a",
			destinationNavigatorKey: "nav-a",
		});
		registerSourceAndDestination({
			tag,
			sourceScreenKey: "screen-b",
			destinationScreenKey: "detail-b",
			sourceNavigatorKey: "nav-b",
			destinationNavigatorKey: "nav-b",
		});
		BoundStore.registerBoundaryPresence(tag, "screen-a", undefined, undefined, "nav-a");
		BoundStore.registerBoundaryPresence(tag, "screen-b", undefined, undefined, "nav-b");

		BoundStore.clearByBranch("nav-a");

		expect(BoundStore.getSnapshot(tag, "screen-a")).toBeNull();
		expect(BoundStore.getSnapshot(tag, "screen-b")).not.toBeNull();
		expect(BoundStore.getActiveLink(tag, "detail-a")).toBeNull();
		expect(BoundStore.getActiveLink(tag, "detail-b")).not.toBeNull();
		expect(BoundStore.hasBoundaryPresence(tag, "screen-a")).toBe(false);
		expect(BoundStore.hasBoundaryPresence(tag, "screen-b")).toBe(true);
	});
});
