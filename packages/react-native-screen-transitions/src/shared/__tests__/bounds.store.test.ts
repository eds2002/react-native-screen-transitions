import { beforeEach, describe, expect, it } from "bun:test";
import { BoundStore, type Snapshot } from "../stores/bounds.store";

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
