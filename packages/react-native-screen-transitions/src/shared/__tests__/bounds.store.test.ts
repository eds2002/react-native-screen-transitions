import { beforeEach, describe, expect, it } from "bun:test";
import { BoundStore, type Snapshot } from "../stores/bounds";


// Helper to create mock bounds
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

// Reset registry before each test
beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

// =============================================================================
// Unit Tests - registerSnapshot
// =============================================================================

describe("BoundStore.registerSnapshot", () => {
	it("registers new tag with bounds and styles", () => {
		const bounds = createBounds(10, 20, 200, 300);
		const styles = { backgroundColor: "red" };

		BoundStore.registerSnapshot("card", "screen-a", bounds, styles);

		const snapshot = BoundStore.getSnapshot("card", "screen-a");
		expect(snapshot).not.toBeNull();
		expect(snapshot?.bounds).toEqual(bounds);
		expect(snapshot?.styles).toEqual(styles);
	});

	it("adds snapshot to existing tag", () => {
		const boundsA = createBounds(0, 0, 100, 100);
		const boundsB = createBounds(50, 50, 150, 150);

		BoundStore.registerSnapshot("card", "screen-a", boundsA);
		BoundStore.registerSnapshot("card", "screen-b", boundsB);

		expect(BoundStore.getSnapshot("card", "screen-a")?.bounds).toEqual(boundsA);
		expect(BoundStore.getSnapshot("card", "screen-b")?.bounds).toEqual(boundsB);
	});

	it("stores ancestorKeys correctly", () => {
		const bounds = createBounds();
		const ancestors = ["stack-a", "tab-nav"];

		BoundStore.registerSnapshot("card", "screen-a", bounds, {}, ancestors);

		// Verify ancestor matching works
		const viaAncestor = BoundStore.getSnapshot("card", "stack-a");
		expect(viaAncestor).not.toBeNull();
		expect(viaAncestor?.bounds).toEqual(bounds);
	});

	it("updates existing snapshot on re-measurement", () => {
		const initialBounds = createBounds(0, 0, 100, 100);
		const updatedBounds = createBounds(10, 10, 200, 200);

		BoundStore.registerSnapshot("card", "screen-a", initialBounds);
		BoundStore.registerSnapshot("card", "screen-a", updatedBounds);

		const snapshot = BoundStore.getSnapshot("card", "screen-a");
		expect(snapshot?.bounds).toEqual(updatedBounds);
	});
});

// =============================================================================
// Unit Tests - setLinkSource / setLinkDestination
// =============================================================================

describe("BoundStore.setLinkSource", () => {
	it("creates new tag if it does not exist", () => {
		const bounds = createBounds();

		BoundStore.setLinkSource("card", "screen-a", bounds);

		const link = BoundStore.getActiveLink("card");
		expect(link).not.toBeNull();
		expect(link?.source.screenKey).toBe("screen-a");
	});

	it("pushes link with source and null destination", () => {
		const bounds = createBounds();

		BoundStore.setLinkSource("card", "screen-a", bounds);

		const link = BoundStore.getActiveLink("card");
		expect(link?.source.screenKey).toBe("screen-a");
		expect(link?.destination).toBeNull();
	});

	it("multiple sources create multiple links", () => {
		const boundsA = createBounds(0, 0);
		const boundsB = createBounds(100, 100);

		BoundStore.setLinkSource("card", "screen-a", boundsA);
		BoundStore.setLinkSource("card", "screen-b", boundsB);

		// Most recent link should be from screen-b
		const link = BoundStore.getActiveLink("card");
		expect(link?.source.screenKey).toBe("screen-b");
	});

	it("coalesces duplicate pending source from same screen", () => {
		const first = createBounds(0, 0, 100, 100);
		const second = createBounds(20, 30, 120, 130);

		BoundStore.setLinkSource("card", "screen-a", first);
		BoundStore.setLinkSource("card", "screen-a", second);

		// Completing destination once should finalize the single coalesced pending link.
		BoundStore.setLinkDestination("card", "screen-b", createBounds(200, 200));

		const link = BoundStore.getActiveLink("card", "screen-b");
		expect(link?.source.screenKey).toBe("screen-a");
		expect(link?.source.bounds).toEqual(second);
		expect(link?.destination?.screenKey).toBe("screen-b");
	});
});

describe("BoundStore.updateLinkSource", () => {
	it("updates source in place and preserves destination", () => {
		const initialSource = createBounds(0, 0, 100, 100);
		const destination = createBounds(100, 100, 200, 200);
		const updatedSource = createBounds(20, 30, 120, 120);

		BoundStore.setLinkSource("card", "screen-a", initialSource);
		BoundStore.setLinkDestination("card", "screen-b", destination);
		BoundStore.updateLinkSource("card", "screen-a", updatedSource);

		const link = BoundStore.getActiveLink("card", "screen-a");
		expect(link?.source.bounds).toEqual(updatedSource);
		expect(link?.destination?.screenKey).toBe("screen-b");
		expect(link?.destination?.bounds).toEqual(destination);
	});

	it("prefers newest completed matching link over newer pending link", () => {
		const completedSource = createBounds(0, 0, 100, 100);
		const pendingSource = createBounds(50, 50, 100, 100);
		const destination = createBounds(100, 100, 150, 150);
		const updatedSource = createBounds(10, 10, 110, 110);

		BoundStore.setLinkSource("card", "screen-a", completedSource);
		BoundStore.setLinkDestination("card", "screen-b", destination);

		// Newer pending link with same source screen.
		BoundStore.setLinkSource("card", "screen-a", pendingSource);

		BoundStore.updateLinkSource("card", "screen-a", updatedSource);

		const completed = BoundStore.getActiveLink("card", "screen-b");
		expect(completed?.source.bounds).toEqual(updatedSource);

		const latest = BoundStore.getActiveLink("card");
		expect(latest?.destination).toBeNull();
		expect(latest?.source.bounds).toEqual(pendingSource);
	});

	it("falls back to pending matching link when no completed link exists", () => {
		const pendingSource = createBounds(25, 25, 100, 100);
		const updatedSource = createBounds(30, 35, 110, 115);

		BoundStore.setLinkSource("card", "screen-a", pendingSource);
		BoundStore.updateLinkSource("card", "screen-a", updatedSource);

		const latest = BoundStore.getActiveLink("card");
		expect(latest?.destination).toBeNull();
		expect(latest?.source.bounds).toEqual(updatedSource);
	});

	it("no-ops when no matching source exists", () => {
		const source = createBounds(0, 0, 100, 100);
		const destination = createBounds(100, 100, 120, 120);

		BoundStore.setLinkSource("card", "screen-a", source);
		BoundStore.setLinkDestination("card", "screen-b", destination);
		BoundStore.updateLinkSource("card", "screen-x", createBounds(999, 999));

		const link = BoundStore.getActiveLink("card", "screen-a");
		expect(link?.source.bounds).toEqual(source);
	});
});

describe("BoundStore.setLinkDestination", () => {
	it("fills topmost link with null destination", () => {
		const srcBounds = createBounds(0, 0);
		const dstBounds = createBounds(100, 100);

		BoundStore.setLinkSource("card", "screen-a", srcBounds);
		BoundStore.setLinkDestination("card", "screen-b", dstBounds);

		const link = BoundStore.getActiveLink("card");
		expect(link?.source.screenKey).toBe("screen-a");
		expect(link?.destination?.screenKey).toBe("screen-b");
	});

	it("ignores if no pending links", () => {
		const bounds = createBounds();

		// No source set, destination should be ignored
		BoundStore.setLinkDestination("card", "screen-b", bounds);

		const link = BoundStore.getActiveLink("card");
		expect(link).toBeNull();
	});

	it("fills correct link when multiple pending", () => {
		const boundsA = createBounds(0, 0);
		const boundsB = createBounds(50, 50);
		const boundsC = createBounds(100, 100);

		// Two sources, one destination
		BoundStore.setLinkSource("card", "screen-a", boundsA);
		BoundStore.setLinkSource("card", "screen-b", boundsB);
		BoundStore.setLinkDestination("card", "screen-c", boundsC);

		// Most recent link (from screen-b) should have destination
		const link = BoundStore.getActiveLink("card");
		expect(link?.source.screenKey).toBe("screen-b");
		expect(link?.destination?.screenKey).toBe("screen-c");
	});

	it("targets pending link by expected source screen", () => {
		const boundsA = createBounds(0, 0);
		const boundsB = createBounds(50, 50);
		const destination = createBounds(200, 200);

		BoundStore.setLinkSource("card", "screen-a", boundsA);
		BoundStore.setLinkSource("card", "screen-b", boundsB);

		BoundStore.setLinkDestination(
			"card",
			"screen-detail",
			destination,
			{},
			undefined,
			"screen-a",
		);

		const fromDetail = BoundStore.getActiveLink("card", "screen-detail");
		expect(fromDetail?.source.screenKey).toBe("screen-a");
		expect(fromDetail?.destination?.screenKey).toBe("screen-detail");

		const latest = BoundStore.getActiveLink("card");
		expect(latest?.source.screenKey).toBe("screen-b");
		expect(latest?.destination).toBeNull();
	});

	it("no-ops in expected source mode when no matching pending source exists", () => {
		BoundStore.setLinkSource("card", "screen-a", createBounds());

		BoundStore.setLinkDestination(
			"card",
			"screen-detail",
			createBounds(200, 200),
			{},
			undefined,
			"screen-x",
		);

		const link = BoundStore.getActiveLink("card");
		expect(link?.source.screenKey).toBe("screen-a");
		expect(link?.destination).toBeNull();
	});
});

// =============================================================================
// Unit Tests - getSnapshot
// =============================================================================

describe("BoundStore.getSnapshot", () => {
	it("returns null for unknown tag", () => {
		const result = BoundStore.getSnapshot("unknown", "screen-a");
		expect(result).toBeNull();
	});

	it("returns bounds and styles for direct key match", () => {
		const bounds = createBounds(10, 20, 300, 400);
		const styles = { borderRadius: 8 };

		BoundStore.registerSnapshot("card", "screen-a", bounds, styles);

		const result = BoundStore.getSnapshot("card", "screen-a");
		expect(result).toEqual({ bounds, styles });
	});

	it("returns bounds via ancestor match", () => {
		const bounds = createBounds();
		const ancestors = ["stack-a", "root"];

		BoundStore.registerSnapshot("card", "screen-a", bounds, {}, ancestors);

		// Query by ancestor key
		const result = BoundStore.getSnapshot("card", "stack-a");
		expect(result).not.toBeNull();
		expect(result?.bounds).toEqual(bounds);
	});

	it("prefers direct match over ancestor match", () => {
		const directBounds = createBounds(0, 0, 100, 100);
		const ancestorBounds = createBounds(200, 200, 50, 50);

		// Register with ancestor that matches another screen's key
		BoundStore.registerSnapshot("card", "screen-a", ancestorBounds, {}, [
			"stack-a",
		]);
		BoundStore.registerSnapshot("card", "stack-a", directBounds);

		// Direct match should win
		const result = BoundStore.getSnapshot("card", "stack-a");
		expect(result?.bounds).toEqual(directBounds);
	});
});

// =============================================================================
// Unit Tests - getActiveLink
// =============================================================================

describe("BoundStore.getActiveLink", () => {
	it("returns null for unknown tag", () => {
		const result = BoundStore.getActiveLink("unknown");
		expect(result).toBeNull();
	});

	it("returns null for empty linkStack", () => {
		// Register snapshot but no links
		BoundStore.registerSnapshot("card", "screen-a", createBounds());

		const result = BoundStore.getActiveLink("card");
		expect(result).toBeNull();
	});

	it("returns most recent link when no screenKey provided", () => {
		BoundStore.setLinkSource("card", "screen-a", createBounds());
		BoundStore.setLinkDestination("card", "screen-b", createBounds());
		BoundStore.setLinkSource("card", "screen-b", createBounds());
		BoundStore.setLinkDestination("card", "screen-c", createBounds());

		const link = BoundStore.getActiveLink("card");
		expect(link?.source.screenKey).toBe("screen-b");
		expect(link?.destination?.screenKey).toBe("screen-c");
	});

	it("infers isClosing when screenKey matches source", () => {
		BoundStore.setLinkSource("card", "screen-a", createBounds());
		BoundStore.setLinkDestination("card", "screen-b", createBounds());

		// Query from source screen = closing (going back)
		const linkFromSource = BoundStore.getActiveLink("card", "screen-a");
		expect(linkFromSource?.source.screenKey).toBe("screen-a");

		// Query from destination screen = opening
		const linkFromDest = BoundStore.getActiveLink("card", "screen-b");
		expect(linkFromDest?.destination?.screenKey).toBe("screen-b");
	});

	it("ancestor matching works in link lookup", () => {
		const ancestors = ["stack-a"];

		BoundStore.setLinkSource("card", "screen-a", createBounds(), {}, ancestors);
		BoundStore.setLinkDestination("card", "screen-b", createBounds());

		// Query by ancestor key (matches source)
		const link = BoundStore.getActiveLink("card", "stack-a");
		expect(link).not.toBeNull();
		expect(link?.source.screenKey).toBe("screen-a");
	});

	it("returns null when screenKey does not match any link", () => {
		BoundStore.setLinkSource("card", "screen-a", createBounds());
		BoundStore.setLinkDestination("card", "screen-b", createBounds());

		const link = BoundStore.getActiveLink("card", "screen-x");
		expect(link).toBeNull();
	});
});

describe("BoundStore.resolveTransitionPair", () => {
	it("entering prefers completed link whose destination matches current", () => {
		const source = createBounds(0, 0, 100, 100);
		const destination = createBounds(100, 120, 220, 240);

		BoundStore.setLinkSource("card", "screen-a", source);
		BoundStore.setLinkDestination("card", "screen-b", destination);

		const resolved = BoundStore.resolveTransitionPair("card", {
			entering: true,
			currentScreenKey: "screen-b",
			previousScreenKey: "screen-a",
		});

		expect(resolved.sourceBounds).toEqual(source);
		expect(resolved.destinationBounds).toEqual(destination);
		expect(resolved.usedPending).toBe(false);
		expect(resolved.usedSnapshotSource).toBe(false);
		expect(resolved.usedSnapshotDestination).toBe(false);
	});

	it("entering falls back to pending-from-previous and destination snapshot", () => {
		const source = createBounds(10, 20, 100, 100);
		const destinationSnapshot = createBounds(200, 220, 240, 260);

		BoundStore.setLinkSource("card", "screen-a", source);
		BoundStore.registerSnapshot("card", "screen-b", destinationSnapshot);

		const resolved = BoundStore.resolveTransitionPair("card", {
			entering: true,
			currentScreenKey: "screen-b",
			previousScreenKey: "screen-a",
		});

		expect(resolved.sourceBounds).toEqual(source);
		expect(resolved.destinationBounds).toEqual(destinationSnapshot);
		expect(resolved.usedPending).toBe(true);
		expect(resolved.usedSnapshotSource).toBe(false);
		expect(resolved.usedSnapshotDestination).toBe(true);
	});

	it("exiting prefers completed link whose source matches current", () => {
		const source = createBounds(100, 120, 220, 240);
		const destination = createBounds(0, 0, 100, 100);

		BoundStore.setLinkSource("card", "screen-b", source);
		BoundStore.setLinkDestination("card", "screen-a", destination);

		const resolved = BoundStore.resolveTransitionPair("card", {
			entering: false,
			currentScreenKey: "screen-b",
			nextScreenKey: "screen-a",
		});

		expect(resolved.sourceBounds).toEqual(source);
		expect(resolved.destinationBounds).toEqual(destination);
		expect(resolved.usedPending).toBe(false);
	});

	it("uses snapshot fallback for source-only and source+destination recovery", () => {
		const sourceSnapshot = createBounds(12, 24, 80, 90);
		const destinationSnapshot = createBounds(40, 50, 200, 210);

		BoundStore.registerSnapshot("card", "screen-a", sourceSnapshot);

		const sourceOnly = BoundStore.resolveTransitionPair("card", {
			entering: true,
			previousScreenKey: "screen-a",
			currentScreenKey: "screen-b",
		});

		expect(sourceOnly.sourceBounds).toEqual(sourceSnapshot);
		expect(sourceOnly.destinationBounds).toBeNull();
		expect(sourceOnly.usedSnapshotSource).toBe(true);
		expect(sourceOnly.usedSnapshotDestination).toBe(false);

		BoundStore.registerSnapshot("card", "screen-b", destinationSnapshot);

		const sourceAndDestination = BoundStore.resolveTransitionPair("card", {
			entering: true,
			previousScreenKey: "screen-a",
			currentScreenKey: "screen-b",
		});

		expect(sourceAndDestination.sourceBounds).toEqual(sourceSnapshot);
		expect(sourceAndDestination.destinationBounds).toEqual(destinationSnapshot);
		expect(sourceAndDestination.usedSnapshotSource).toBe(true);
		expect(sourceAndDestination.usedSnapshotDestination).toBe(true);
	});

	it("resolves grouped and non-group tags with identical selection behavior", () => {
		const source = createBounds(1, 2, 111, 122);
		const destinationSnapshot = createBounds(200, 210, 230, 240);
		const tags = ["card", "zoom-sync:card"];

		for (const tag of tags) {
			BoundStore.setLinkSource(tag, "screen-a", source);
			BoundStore.registerSnapshot(tag, "screen-b", destinationSnapshot);
		}

		const plain = BoundStore.resolveTransitionPair("card", {
			entering: true,
			previousScreenKey: "screen-a",
			currentScreenKey: "screen-b",
		});
		const grouped = BoundStore.resolveTransitionPair("zoom-sync:card", {
			entering: true,
			previousScreenKey: "screen-a",
			currentScreenKey: "screen-b",
		});

		expect(grouped).toEqual(plain);
	});
});

describe("BoundStore link predicates", () => {
	it("hasPendingLink returns true when destination is missing", () => {
		BoundStore.setLinkSource("card", "screen-a", createBounds());

		expect(BoundStore.hasPendingLink("card")).toBe(true);
	});

	it("hasPendingLink returns false when latest links are complete", () => {
		BoundStore.setLinkSource("card", "screen-a", createBounds());
		BoundStore.setLinkDestination("card", "screen-b", createBounds());

		expect(BoundStore.hasPendingLink("card")).toBe(false);
	});

	it("hasPendingLinkFromSource matches pending source screen", () => {
		BoundStore.setLinkSource("card", "screen-a", createBounds());
		BoundStore.setLinkSource("card", "screen-b", createBounds());

		expect(BoundStore.hasPendingLinkFromSource("card", "screen-a")).toBe(true);
		expect(BoundStore.hasPendingLinkFromSource("card", "screen-b")).toBe(true);
		expect(BoundStore.hasPendingLinkFromSource("card", "screen-x")).toBe(
			false,
		);
	});

	it("hasPendingLinkFromSource supports ancestor matching", () => {
		BoundStore.setLinkSource("card", "screen-a", createBounds(), {}, ["stack-a"]);

		expect(BoundStore.hasPendingLinkFromSource("card", "stack-a")).toBe(true);
	});

	it("getLatestPendingSourceScreenKey returns most recent pending source", () => {
		BoundStore.setLinkSource("card", "screen-a", createBounds());
		BoundStore.setLinkSource("card", "screen-b", createBounds());

		expect(BoundStore.getLatestPendingSourceScreenKey("card")).toBe("screen-b");

		BoundStore.setLinkDestination("card", "screen-c", createBounds());
		expect(BoundStore.getLatestPendingSourceScreenKey("card")).toBe("screen-a");
	});

	it("hasSourceLink matches direct source screen", () => {
		BoundStore.setLinkSource("card", "screen-a", createBounds());

		expect(BoundStore.hasSourceLink("card", "screen-a")).toBe(true);
		expect(BoundStore.hasSourceLink("card", "screen-x")).toBe(false);
	});

	it("hasSourceLink matches source ancestor chain", () => {
		BoundStore.setLinkSource("card", "screen-a", createBounds(), {}, ["stack-a"]);

		expect(BoundStore.hasSourceLink("card", "stack-a")).toBe(true);
	});

	it("hasDestinationLink matches direct destination screen", () => {
		BoundStore.setLinkSource("card", "screen-a", createBounds());
		BoundStore.setLinkDestination("card", "screen-b", createBounds());

		expect(BoundStore.hasDestinationLink("card", "screen-b")).toBe(true);
		expect(BoundStore.hasDestinationLink("card", "screen-x")).toBe(false);
	});

	it("hasDestinationLink matches destination ancestor chain", () => {
		BoundStore.setLinkSource("card", "screen-a", createBounds());
		BoundStore.setLinkDestination("card", "screen-b", createBounds(), {}, [
			"stack-b",
		]);

		expect(BoundStore.hasDestinationLink("card", "stack-b")).toBe(true);
	});
});

describe("BoundStore boundary presence", () => {
	it("tracks boundary presence by tag and screen", () => {
		BoundStore.registerBoundaryPresence("card", "screen-a");

		expect(BoundStore.hasBoundaryPresence("card", "screen-a")).toBe(true);
		expect(BoundStore.hasBoundaryPresence("card", "screen-b")).toBe(false);
	});

	it("supports ancestor matching for boundary presence", () => {
		BoundStore.registerBoundaryPresence("card", "screen-a", ["stack-a"]);

		expect(BoundStore.hasBoundaryPresence("card", "stack-a")).toBe(true);
	});

	it("keeps presence alive until all duplicates unmount", () => {
		BoundStore.registerBoundaryPresence("card", "screen-a");
		BoundStore.registerBoundaryPresence("card", "screen-a");
		BoundStore.unregisterBoundaryPresence("card", "screen-a");

		expect(BoundStore.hasBoundaryPresence("card", "screen-a")).toBe(true);

		BoundStore.unregisterBoundaryPresence("card", "screen-a");
		expect(BoundStore.hasBoundaryPresence("card", "screen-a")).toBe(false);
	});

	it("clear removes boundary presence for a screen", () => {
		BoundStore.registerBoundaryPresence("card", "screen-a");
		BoundStore.registerBoundaryPresence("card", "screen-b");

		BoundStore.clear("screen-a");

		expect(BoundStore.hasBoundaryPresence("card", "screen-a")).toBe(false);
		expect(BoundStore.hasBoundaryPresence("card", "screen-b")).toBe(true);
	});

	it("stores boundary config and retrieves it by direct screen key", () => {
		BoundStore.registerBoundaryPresence("card", "screen-a", undefined, {
			anchor: "top",
			scaleMode: "uniform",
			target: "fullscreen",
			method: "content",
		});

		expect(BoundStore.getBoundaryConfig("card", "screen-a")).toEqual({
			anchor: "top",
			scaleMode: "uniform",
			target: "fullscreen",
			method: "content",
		});
	});

	it("updates boundary config when re-registering same screen", () => {
		BoundStore.registerBoundaryPresence("card", "screen-a", undefined, {
			anchor: "center",
			method: "transform",
		});

		BoundStore.registerBoundaryPresence("card", "screen-a", undefined, {
			anchor: "bottom",
			method: "size",
		});

		expect(BoundStore.getBoundaryConfig("card", "screen-a")).toEqual({
			anchor: "bottom",
			method: "size",
		});
	});

	it("supports ancestor matching for boundary config", () => {
		BoundStore.registerBoundaryPresence("card", "screen-a", ["stack-a"], {
			anchor: "topLeading",
			scaleMode: "match",
		});

		expect(BoundStore.getBoundaryConfig("card", "stack-a")).toEqual({
			anchor: "topLeading",
			scaleMode: "match",
		});
	});

	it("clear removes boundary config for the cleared screen", () => {
		BoundStore.registerBoundaryPresence("card", "screen-a", undefined, {
			anchor: "top",
		});
		BoundStore.registerBoundaryPresence("card", "screen-b", undefined, {
			anchor: "bottom",
		});

		BoundStore.clear("screen-a");

		expect(BoundStore.getBoundaryConfig("card", "screen-a")).toBeNull();
		expect(BoundStore.getBoundaryConfig("card", "screen-b")).toEqual({
			anchor: "bottom",
		});
	});
});

// =============================================================================
// Scenario Tests - Navigation Flows
// =============================================================================

describe("Scenario: Simple push/pop navigation", () => {
	it("captures source on press, destination on layout, reverses on pop", () => {
		const srcBounds = createBounds(50, 100, 200, 200);
		const dstBounds = createBounds(0, 0, 400, 400);

		// 1. User presses card on Screen A (source captured)
		BoundStore.setLinkSource("card", "screen-a", srcBounds);

		// 2. Screen B mounts, measures card (destination captured)
		BoundStore.setLinkDestination("card", "screen-b", dstBounds);

		// Verify link is complete - query from destination (opening)
		const openingLink = BoundStore.getActiveLink("card", "screen-b");
		expect(openingLink?.source.bounds).toEqual(srcBounds);
		expect(openingLink?.destination?.bounds).toEqual(dstBounds);

		// 3. Query from source (closing - going back)
		const closingLink = BoundStore.getActiveLink("card", "screen-a");
		expect(closingLink?.source.screenKey).toBe("screen-a");
		expect(closingLink?.destination?.screenKey).toBe("screen-b");
	});
});

describe("Scenario: Multiple bounds, only one matches", () => {
	it("establishes link only for matching bound", () => {
		// Screen A has header, card, footer
		BoundStore.registerSnapshot("header", "screen-a", createBounds(0, 0));
		BoundStore.registerSnapshot("card", "screen-a", createBounds(0, 100));
		BoundStore.registerSnapshot("footer", "screen-a", createBounds(0, 500));

		// Only card triggers navigation
		BoundStore.setLinkSource("card", "screen-a", createBounds(0, 100));

		// Screen B only has card
		BoundStore.setLinkDestination("card", "screen-b", createBounds(0, 0));

		// Card link exists
		expect(BoundStore.getActiveLink("card")).not.toBeNull();

		// Header and footer have no links (only snapshots)
		expect(BoundStore.getActiveLink("header")).toBeNull();
		expect(BoundStore.getActiveLink("footer")).toBeNull();
	});
});

describe("Scenario: Nested navigator with ancestor keys", () => {
	it("supports cross-stack bounds via ancestor matching", () => {
		// Tab Navigator structure:
		// - Stack A (key: "stack-a") -> Screen A1 (key: "a1", ancestors: ["stack-a"])
		// - Stack B (key: "stack-b") -> Screen B1 (key: "b1", ancestors: ["stack-b"])

		const boundsA = createBounds(10, 10, 80, 80);
		const boundsB = createBounds(20, 20, 100, 100);

		// Register snapshot in Stack A
		BoundStore.registerSnapshot("profile", "a1", boundsA, {}, ["stack-a"]);

		// Register snapshot in Stack B
		BoundStore.registerSnapshot("profile", "b1", boundsB, {}, ["stack-b"]);

		// Query by stack key should return correct bounds
		const fromStackA = BoundStore.getSnapshot("profile", "stack-a");
		expect(fromStackA?.bounds).toEqual(boundsA);

		const fromStackB = BoundStore.getSnapshot("profile", "stack-b");
		expect(fromStackB?.bounds).toEqual(boundsB);
	});

	it("getActiveLink respects ancestor chain", () => {
		// Navigation from Stack A to detail screen
		BoundStore.setLinkSource("profile", "a1", createBounds(10, 10), {}, [
			"stack-a",
		]);
		BoundStore.setLinkDestination("profile", "detail", createBounds(0, 0));

		// Query by ancestor should find the link
		const link = BoundStore.getActiveLink("profile", "stack-a");
		expect(link?.source.screenKey).toBe("a1");
	});
});

describe("Scenario: Rapid navigation A → B → C → pop → pop", () => {
	it("link stack grows and getActiveLink finds correct link for each screen", () => {
		// A → B
		BoundStore.setLinkSource("card", "screen-a", createBounds(0, 0));
		BoundStore.setLinkDestination("card", "screen-b", createBounds(100, 100));

		// B → C
		BoundStore.setLinkSource("card", "screen-b", createBounds(100, 100));
		BoundStore.setLinkDestination("card", "screen-c", createBounds(200, 200));

		// Most recent link is B → C
		const latest = BoundStore.getActiveLink("card");
		expect(latest?.source.screenKey).toBe("screen-b");
		expect(latest?.destination?.screenKey).toBe("screen-c");

		// Query from C (destination of B→C) = opening
		const fromC = BoundStore.getActiveLink("card", "screen-c");
		expect(fromC?.destination?.screenKey).toBe("screen-c");

		// Query from B - B is source of B→C link, so isClosing=true
		const fromB = BoundStore.getActiveLink("card", "screen-b");
		expect(fromB?.source.screenKey).toBe("screen-b");
	});
});

describe("Scenario: Global bounds (fullscreen target)", () => {
	it("getActiveLink with no screenKey returns most recent for fullscreen", () => {
		// Source exists, destination will be fullscreen (no specific screenKey needed)
		BoundStore.setLinkSource(
			"image",
			"gallery",
			createBounds(50, 50, 100, 100),
		);
		BoundStore.setLinkDestination(
			"image",
			"fullscreen-viewer",
			createBounds(0, 0, 400, 800),
		);

		// Fullscreen target can get link without knowing screenKey
		const link = BoundStore.getActiveLink("image");
		expect(link).not.toBeNull();
		expect(link?.destination?.screenKey).toBe("fullscreen-viewer");
	});
});
