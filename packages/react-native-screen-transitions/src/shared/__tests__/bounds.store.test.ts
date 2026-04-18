import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { BoundStore, type Entry } from "../stores/bounds";

const originalConsoleWarn = console.warn;

// Helper to create mock bounds
const createBounds = (
	x = 0,
	y = 0,
	width = 100,
	height = 100,
): Entry["bounds"] => ({
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

afterEach(() => {
	console.warn = originalConsoleWarn;
});

// =============================================================================
// Unit Tests - entry.set / entry.getMeasured
// =============================================================================

describe("BoundStore.entry.set", () => {
	it("registers new tag with bounds and styles", () => {
		const bounds = createBounds(10, 20, 200, 300);
		const styles = { backgroundColor: "red" };

		BoundStore.entry.set("card", "screen-a", { bounds, styles });

		const measuredEntry = BoundStore.entry.getMeasured("card", "screen-a");
		expect(measuredEntry).not.toBeNull();
		expect(measuredEntry?.bounds).toEqual(bounds);
		expect(measuredEntry?.styles).toEqual(styles);
	});

	it("adds a measured entry to an existing tag", () => {
		const boundsA = createBounds(0, 0, 100, 100);
		const boundsB = createBounds(50, 50, 150, 150);

		BoundStore.entry.set("card", "screen-a", { bounds: boundsA });
		BoundStore.entry.set("card", "screen-b", { bounds: boundsB });

		expect(BoundStore.entry.getMeasured("card", "screen-a")?.bounds).toEqual(
			boundsA,
		);
		expect(BoundStore.entry.getMeasured("card", "screen-b")?.bounds).toEqual(
			boundsB,
		);
	});

	it("stores ancestorKeys correctly", () => {
		const bounds = createBounds();
		const ancestors = ["stack-a", "tab-nav"];

		BoundStore.entry.set("card", "screen-a", {
			bounds,
			ancestorKeys: ancestors,
		});

		// Verify ancestor matching works
		const viaAncestor = BoundStore.entry.getMeasured("card", "stack-a");
		expect(viaAncestor).not.toBeNull();
		expect(viaAncestor?.bounds).toEqual(bounds);
	});

	it("updates an existing measured entry on re-measurement", () => {
		const initialBounds = createBounds(0, 0, 100, 100);
		const updatedBounds = createBounds(10, 10, 200, 200);

		BoundStore.entry.set("card", "screen-a", { bounds: initialBounds });
		BoundStore.entry.set("card", "screen-a", { bounds: updatedBounds });

		const measuredEntry = BoundStore.entry.getMeasured("card", "screen-a");
		expect(measuredEntry?.bounds).toEqual(updatedBounds);
	});
});

// =============================================================================
// Unit Tests - setSource / setDestination
// =============================================================================

describe("BoundStore.link.setSource", () => {
	it("creates new tag if it does not exist", () => {
		const bounds = createBounds();

		BoundStore.link.setSource("capture", "card", "screen-a", bounds);

		const link = BoundStore.link.getActive("card");
		expect(link).not.toBeNull();
		expect(link?.source.screenKey).toBe("screen-a");
	});

	it("pushes link with source and null destination", () => {
		const bounds = createBounds();

		BoundStore.link.setSource("capture", "card", "screen-a", bounds);

		const link = BoundStore.link.getActive("card");
		expect(link?.source.screenKey).toBe("screen-a");
		expect(link?.destination).toBeNull();
	});

	it("multiple sources create multiple links", () => {
		const boundsA = createBounds(0, 0);
		const boundsB = createBounds(100, 100);

		BoundStore.link.setSource("capture", "card", "screen-a", boundsA);
		BoundStore.link.setSource("capture", "card", "screen-b", boundsB);

		// Most recent link should be from screen-b
		const link = BoundStore.link.getActive("card");
		expect(link?.source.screenKey).toBe("screen-b");
	});

	it("coalesces duplicate pending source from same screen", () => {
		const first = createBounds(0, 0, 100, 100);
		const second = createBounds(20, 30, 120, 130);

		BoundStore.link.setSource("capture", "card", "screen-a", first);
		BoundStore.link.setSource("capture", "card", "screen-a", second);

		// Completing destination once should finalize the single coalesced pending link.
		BoundStore.link.setDestination("attach", "card", "screen-b", createBounds(200, 200));

		const link = BoundStore.link.getActive("card", "screen-b");
		expect(link?.source.screenKey).toBe("screen-a");
		expect(link?.source.bounds).toEqual(second);
		expect(link?.destination?.screenKey).toBe("screen-b");
	});
});

describe("BoundStore.link.setSource(refresh)", () => {
	it("updates source in place and preserves destination", () => {
		const initialSource = createBounds(0, 0, 100, 100);
		const destination = createBounds(100, 100, 200, 200);
		const updatedSource = createBounds(20, 30, 120, 120);

		BoundStore.link.setSource("capture", "card", "screen-a", initialSource);
		BoundStore.link.setDestination("attach", "card", "screen-b", destination);
		BoundStore.link.setSource("refresh", "card", "screen-a", updatedSource);

		const link = BoundStore.link.getActive("card", "screen-a");
		expect(link?.source.bounds).toEqual(updatedSource);
		expect(link?.destination?.screenKey).toBe("screen-b");
		expect(link?.destination?.bounds).toEqual(destination);
	});

	it("prefers newest completed matching link over newer pending link", () => {
		const completedSource = createBounds(0, 0, 100, 100);
		const pendingSource = createBounds(50, 50, 100, 100);
		const destination = createBounds(100, 100, 150, 150);
		const updatedSource = createBounds(10, 10, 110, 110);

		BoundStore.link.setSource("capture", "card", "screen-a", completedSource);
		BoundStore.link.setDestination("attach", "card", "screen-b", destination);

		// Newer pending link with same source screen.
		BoundStore.link.setSource("capture", "card", "screen-a", pendingSource);

		BoundStore.link.setSource("refresh", "card", "screen-a", updatedSource);

		const completed = BoundStore.link.getActive("card", "screen-b");
		expect(completed?.source.bounds).toEqual(updatedSource);

		const latest = BoundStore.link.getActive("card");
		expect(latest?.destination).toBeNull();
		expect(latest?.source.bounds).toEqual(pendingSource);
	});

	it("falls back to pending matching link when no completed link exists", () => {
		const pendingSource = createBounds(25, 25, 100, 100);
		const updatedSource = createBounds(30, 35, 110, 115);

		BoundStore.link.setSource("capture", "card", "screen-a", pendingSource);
		BoundStore.link.setSource("refresh", "card", "screen-a", updatedSource);

		const latest = BoundStore.link.getActive("card");
		expect(latest?.destination).toBeNull();
		expect(latest?.source.bounds).toEqual(updatedSource);
	});

	it("no-ops when no matching source exists", () => {
		const source = createBounds(0, 0, 100, 100);
		const destination = createBounds(100, 100, 120, 120);

		BoundStore.link.setSource("capture", "card", "screen-a", source);
		BoundStore.link.setDestination("attach", "card", "screen-b", destination);
		BoundStore.link.setSource("refresh", "card", "screen-x", createBounds(999, 999));

		const link = BoundStore.link.getActive("card", "screen-a");
		expect(link?.source.bounds).toEqual(source);
	});
});

describe("BoundStore.link.setDestination(refresh)", () => {
	it("updates destination in place and preserves source", () => {
		const source = createBounds(0, 0, 100, 100);
		const initialDestination = createBounds(100, 100, 200, 200);
		const updatedDestination = createBounds(120, 130, 220, 230);

		BoundStore.link.setSource("capture", "card", "screen-a", source);
		BoundStore.link.setDestination("attach", "card", "screen-b", initialDestination);
		BoundStore.link.setDestination("refresh", "card", "screen-b", updatedDestination);

		const link = BoundStore.link.getActive("card", "screen-b");
		expect(link?.source.screenKey).toBe("screen-a");
		expect(link?.source.bounds).toEqual(source);
		expect(link?.destination?.bounds).toEqual(updatedDestination);
	});

	it("falls back to pending source when no completed destination exists", () => {
		const boundsA = createBounds(0, 0);
		const boundsB = createBounds(50, 50);
		const destination = createBounds(200, 200);

		BoundStore.link.setSource("capture", "card", "screen-a", boundsA);
		BoundStore.link.setSource("capture", "card", "screen-b", boundsB);

		BoundStore.link.setDestination("refresh", 
			"card",
			"screen-detail",
			destination,
			{},
			undefined,
			"screen-a",
		);

		const fromDetail = BoundStore.link.getActive("card", "screen-detail");
		expect(fromDetail?.source.screenKey).toBe("screen-a");
		expect(fromDetail?.destination?.screenKey).toBe("screen-detail");
		expect(fromDetail?.destination?.bounds).toEqual(destination);

		const latest = BoundStore.link.getActive("card");
		expect(latest?.source.screenKey).toBe("screen-b");
		expect(latest?.destination).toBeNull();
	});
});

describe("BoundStore.link.setDestination", () => {
	it("fills topmost link with null destination", () => {
		const srcBounds = createBounds(0, 0);
		const dstBounds = createBounds(100, 100);

		BoundStore.link.setSource("capture", "card", "screen-a", srcBounds);
		BoundStore.link.setDestination("attach", "card", "screen-b", dstBounds);

		const link = BoundStore.link.getActive("card");
		expect(link?.source.screenKey).toBe("screen-a");
		expect(link?.destination?.screenKey).toBe("screen-b");
	});

	it("ignores if no pending links", () => {
		const bounds = createBounds();

		// No source set, destination should be ignored
		BoundStore.link.setDestination("attach", "card", "screen-b", bounds);

		const link = BoundStore.link.getActive("card");
		expect(link).toBeNull();
	});

	it("fills correct link when multiple pending", () => {
		const boundsA = createBounds(0, 0);
		const boundsB = createBounds(50, 50);
		const boundsC = createBounds(100, 100);

		// Two sources, one destination
		BoundStore.link.setSource("capture", "card", "screen-a", boundsA);
		BoundStore.link.setSource("capture", "card", "screen-b", boundsB);
		BoundStore.link.setDestination("attach", "card", "screen-c", boundsC);

		// Most recent link (from screen-b) should have destination
		const link = BoundStore.link.getActive("card");
		expect(link?.source.screenKey).toBe("screen-b");
		expect(link?.destination?.screenKey).toBe("screen-c");
	});

	it("targets pending link by expected source screen", () => {
		const boundsA = createBounds(0, 0);
		const boundsB = createBounds(50, 50);
		const destination = createBounds(200, 200);

		BoundStore.link.setSource("capture", "card", "screen-a", boundsA);
		BoundStore.link.setSource("capture", "card", "screen-b", boundsB);

		BoundStore.link.setDestination("attach", 
			"card",
			"screen-detail",
			destination,
			{},
			undefined,
			"screen-a",
		);

		const fromDetail = BoundStore.link.getActive("card", "screen-detail");
		expect(fromDetail?.source.screenKey).toBe("screen-a");
		expect(fromDetail?.destination?.screenKey).toBe("screen-detail");

		const latest = BoundStore.link.getActive("card");
		expect(latest?.source.screenKey).toBe("screen-b");
		expect(latest?.destination).toBeNull();
	});

	it("no-ops in expected source mode when no matching pending source exists", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds());

		BoundStore.link.setDestination("attach", 
			"card",
			"screen-detail",
			createBounds(200, 200),
			{},
			undefined,
			"screen-x",
		);

		const link = BoundStore.link.getActive("card");
		expect(link?.source.screenKey).toBe("screen-a");
		expect(link?.destination).toBeNull();
	});
});

// =============================================================================
// Unit Tests - entry.getMeasured
// =============================================================================

describe("BoundStore.entry.getMeasured", () => {
	it("returns null for unknown tag", () => {
		const result = BoundStore.entry.getMeasured("unknown", "screen-a");
		expect(result).toBeNull();
	});

	it("returns bounds and styles for direct key match", () => {
		const bounds = createBounds(10, 20, 300, 400);
		const styles = { borderRadius: 8 };

		BoundStore.entry.set("card", "screen-a", { bounds, styles });

		const result = BoundStore.entry.getMeasured("card", "screen-a");
		expect(result?.bounds).toEqual(bounds);
		expect(result?.styles).toEqual(styles);
	});

	it("returns bounds via ancestor match", () => {
		const bounds = createBounds();
		const ancestors = ["stack-a", "root"];

		BoundStore.entry.set("card", "screen-a", {
			bounds,
			ancestorKeys: ancestors,
		});

		// Query by ancestor key
		const result = BoundStore.entry.getMeasured("card", "stack-a");
		expect(result).not.toBeNull();
		expect(result?.bounds).toEqual(bounds);
	});

	it("prefers direct match over ancestor match", () => {
		const directBounds = createBounds(0, 0, 100, 100);
		const ancestorBounds = createBounds(200, 200, 50, 50);

		// Register with ancestor that matches another screen's key
		BoundStore.entry.set("card", "screen-a", {
			bounds: ancestorBounds,
			ancestorKeys: ["stack-a"],
		});
		BoundStore.entry.set("card", "stack-a", { bounds: directBounds });

		// Direct match should win
		const result = BoundStore.entry.getMeasured("card", "stack-a");
		expect(result?.bounds).toEqual(directBounds);
	});
});

// =============================================================================
// Unit Tests - getActiveLink
// =============================================================================

describe("BoundStore.link.getActive", () => {
	it("returns null for unknown tag", () => {
		const result = BoundStore.link.getActive("unknown");
		expect(result).toBeNull();
	});

	it("returns null for empty linkStack", () => {
		// Register entry but no links
		BoundStore.entry.set("card", "screen-a", { bounds: createBounds() });

		const result = BoundStore.link.getActive("card");
		expect(result).toBeNull();
	});

	it("returns most recent link when no screenKey provided", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds());
		BoundStore.link.setDestination("attach", "card", "screen-b", createBounds());
		BoundStore.link.setSource("capture", "card", "screen-b", createBounds());
		BoundStore.link.setDestination("attach", "card", "screen-c", createBounds());

		const link = BoundStore.link.getActive("card");
		expect(link?.source.screenKey).toBe("screen-b");
		expect(link?.destination?.screenKey).toBe("screen-c");
	});

	it("infers isClosing when screenKey matches source", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds());
		BoundStore.link.setDestination("attach", "card", "screen-b", createBounds());

		// Query from source screen = closing (going back)
		const linkFromSource = BoundStore.link.getActive("card", "screen-a");
		expect(linkFromSource?.source.screenKey).toBe("screen-a");

		// Query from destination screen = opening
		const linkFromDest = BoundStore.link.getActive("card", "screen-b");
		expect(linkFromDest?.destination?.screenKey).toBe("screen-b");
	});

	it("ancestor matching works in link lookup", () => {
		const ancestors = ["stack-a"];

		BoundStore.link.setSource("capture", "card", "screen-a", createBounds(), {}, ancestors);
		BoundStore.link.setDestination("attach", "card", "screen-b", createBounds());

		// Query by ancestor key (matches source)
		const link = BoundStore.link.getActive("card", "stack-a");
		expect(link).not.toBeNull();
		expect(link?.source.screenKey).toBe("screen-a");
	});

	it("returns null when screenKey does not match any link", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds());
		BoundStore.link.setDestination("attach", "card", "screen-b", createBounds());

		const link = BoundStore.link.getActive("card", "screen-x");
		expect(link).toBeNull();
	});
});

describe("BoundStore.link.getPair", () => {
	it("entering prefers completed link whose destination matches current", () => {
		const source = createBounds(0, 0, 100, 100);
		const destination = createBounds(100, 120, 220, 240);

		BoundStore.link.setSource("capture", "card", "screen-a", source);
		BoundStore.link.setDestination("attach", "card", "screen-b", destination);

		const resolved = BoundStore.link.getPair("card", {
			entering: true,
			currentScreenKey: "screen-b",
			previousScreenKey: "screen-a",
		});

		expect(resolved.sourceBounds).toEqual(source);
		expect(resolved.destinationBounds).toEqual(destination);
	});

	it("entering falls back to pending-from-previous source without inventing a destination", () => {
		const source = createBounds(10, 20, 100, 100);

		BoundStore.link.setSource("capture", "card", "screen-a", source);

		const resolved = BoundStore.link.getPair("card", {
			entering: true,
			currentScreenKey: "screen-b",
			previousScreenKey: "screen-a",
		});

		expect(resolved.sourceBounds).toEqual(source);
		expect(resolved.destinationBounds).toBeNull();
	});

	it("exiting prefers completed link whose source matches current", () => {
		const source = createBounds(100, 120, 220, 240);
		const destination = createBounds(0, 0, 100, 100);

		BoundStore.link.setSource("capture", "card", "screen-b", source);
		BoundStore.link.setDestination("attach", "card", "screen-a", destination);

		const resolved = BoundStore.link.getPair("card", {
			entering: false,
			currentScreenKey: "screen-b",
			nextScreenKey: "screen-a",
		});

		expect(resolved.sourceBounds).toEqual(source);
		expect(resolved.destinationBounds).toEqual(destination);
	});

	it("ignores measured-entry-only recovery when no live link exists", () => {
		const sourceEntryBounds = createBounds(12, 24, 80, 90);
		const destinationEntryBounds = createBounds(40, 50, 200, 210);

		BoundStore.entry.set("card", "screen-a", { bounds: sourceEntryBounds });

		const sourceOnly = BoundStore.link.getPair("card", {
			entering: true,
			previousScreenKey: "screen-a",
			currentScreenKey: "screen-b",
		});

		expect(sourceOnly.sourceBounds).toBeNull();
		expect(sourceOnly.destinationBounds).toBeNull();

		BoundStore.entry.set("card", "screen-b", { bounds: destinationEntryBounds });

		const sourceAndDestination = BoundStore.link.getPair("card", {
			entering: true,
			previousScreenKey: "screen-a",
			currentScreenKey: "screen-b",
		});

		expect(sourceAndDestination.sourceBounds).toBeNull();
		expect(sourceAndDestination.destinationBounds).toBeNull();
	});

});

describe("BoundStore.link.getPending", () => {
	it("returns the latest pending link when destination is missing", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds());

		expect(BoundStore.link.getPending("card")?.source.screenKey).toBe("screen-a");
	});

	it("returns null when latest links are complete", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds());
		BoundStore.link.setDestination("attach", "card", "screen-b", createBounds());

		expect(BoundStore.link.getPending("card")).toBeNull();
	});

	it("filters the latest pending link by source screen", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds());
		BoundStore.link.setSource("capture", "card", "screen-b", createBounds());

		expect(BoundStore.link.getPending("card", "screen-a")?.source.screenKey).toBe(
			"screen-a",
		);
		expect(BoundStore.link.getPending("card", "screen-b")?.source.screenKey).toBe(
			"screen-b",
		);
		expect(BoundStore.link.getPending("card", "screen-x")).toBeNull();
	});

	it("supports ancestor matching when filtering by source screen", () => {
		BoundStore.link.setSource(
			"capture",
			"card",
			"screen-a",
			createBounds(),
			{},
			["stack-a"],
		);

		expect(BoundStore.link.getPending("card", "stack-a")?.source.screenKey).toBe(
			"screen-a",
		);
	});

	it("returns the most recent pending link by default", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds());
		BoundStore.link.setSource("capture", "card", "screen-b", createBounds());

		expect(BoundStore.link.getPending("card")?.source.screenKey).toBe("screen-b");

		BoundStore.link.setDestination("attach", "card", "screen-c", createBounds());
		expect(BoundStore.link.getPending("card")?.source.screenKey).toBe("screen-a");
	});

});

describe("BoundStore link predicates", () => {
	it("hasSourceLink matches direct source screen", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds());

		expect(BoundStore.link.hasSource("card", "screen-a")).toBe(true);
		expect(BoundStore.link.hasSource("card", "screen-x")).toBe(false);
	});

	it("hasSourceLink matches source ancestor chain", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds(), {}, ["stack-a"]);

		expect(BoundStore.link.hasSource("card", "stack-a")).toBe(true);
	});

	it("hasDestinationLink matches direct destination screen", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds());
		BoundStore.link.setDestination("attach", "card", "screen-b", createBounds());

		expect(BoundStore.link.hasDestination("card", "screen-b")).toBe(true);
		expect(BoundStore.link.hasDestination("card", "screen-x")).toBe(false);
	});

	it("hasDestinationLink matches destination ancestor chain", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds());
		BoundStore.link.setDestination("attach", "card", "screen-b", createBounds(), {}, [
			"stack-b",
		]);

		expect(BoundStore.link.hasDestination("card", "stack-b")).toBe(true);
	});
});

describe("BoundStore.entry", () => {
	it("tracks entries by tag and screen", () => {
		BoundStore.entry.set("card", "screen-a", {});

		expect(BoundStore.entry.get("card", "screen-a")).not.toBeNull();
		expect(BoundStore.entry.get("card", "screen-b")).toBeNull();
	});

	it("supports ancestor matching for entry lookup", () => {
		BoundStore.entry.set("card", "screen-a", {
			ancestorKeys: ["stack-a"],
		});

		expect(BoundStore.entry.get("card", "stack-a")).not.toBeNull();
	});

	it("remove drops the entire entry", () => {
		const bounds = createBounds(10, 20, 200, 300);

		BoundStore.entry.set("card", "screen-a", {
			bounds,
			boundaryConfig: { anchor: "top" },
		});
		BoundStore.entry.remove("card", "screen-a");

		expect(BoundStore.entry.get("card", "screen-a")).toBeNull();
		expect(BoundStore.entry.getMeasured("card", "screen-a")).toBeNull();
		expect(BoundStore.entry.getConfig("card", "screen-a")).toBeNull();
	});

	it("clear removes entries for a screen", () => {
		BoundStore.entry.set("card", "screen-a", {});
		BoundStore.entry.set("card", "screen-b", {});

		BoundStore.cleanup.byScreen("screen-a");

		expect(BoundStore.entry.get("card", "screen-a")).toBeNull();
		expect(BoundStore.entry.get("card", "screen-b")).not.toBeNull();
	});

	it("stores boundary config and retrieves it by direct screen key", () => {
		BoundStore.entry.set("card", "screen-a", {
			boundaryConfig: {
				anchor: "top",
				scaleMode: "uniform",
				target: "fullscreen",
				method: "content",
			},
		});

		expect(BoundStore.entry.getConfig("card", "screen-a")).toEqual({
			anchor: "top",
			scaleMode: "uniform",
			target: "fullscreen",
			method: "content",
		});
	});

	it("updates boundary config when setting the same screen again", () => {
		BoundStore.entry.set("card", "screen-a", {
			boundaryConfig: {
				anchor: "center",
				method: "transform",
			},
		});

		BoundStore.entry.set("card", "screen-a", {
			boundaryConfig: {
				anchor: "bottom",
				method: "size",
			},
		});

		expect(BoundStore.entry.getConfig("card", "screen-a")).toEqual({
			anchor: "bottom",
			method: "size",
		});
	});

	it("supports ancestor matching for boundary config", () => {
		BoundStore.entry.set("card", "screen-a", {
			ancestorKeys: ["stack-a"],
			boundaryConfig: {
				anchor: "topLeading",
				scaleMode: "match",
			},
		});

		expect(BoundStore.entry.getConfig("card", "stack-a")).toEqual({
			anchor: "topLeading",
			scaleMode: "match",
		});
	});

	it("clear removes boundary config for the cleared screen", () => {
		BoundStore.entry.set("card", "screen-a", {
			boundaryConfig: {
				anchor: "top",
			},
		});
		BoundStore.entry.set("card", "screen-b", {
			boundaryConfig: {
				anchor: "bottom",
			},
		});

		BoundStore.cleanup.byScreen("screen-a");

		expect(BoundStore.entry.getConfig("card", "screen-a")).toBeNull();
		expect(BoundStore.entry.getConfig("card", "screen-b")).toEqual({
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
		BoundStore.link.setSource("capture", "card", "screen-a", srcBounds);

		// 2. Screen B mounts, measures card (destination captured)
		BoundStore.link.setDestination("attach", "card", "screen-b", dstBounds);

		// Verify link is complete - query from destination (opening)
		const openingLink = BoundStore.link.getActive("card", "screen-b");
		expect(openingLink?.source.bounds).toEqual(srcBounds);
		expect(openingLink?.destination?.bounds).toEqual(dstBounds);

		// 3. Query from source (closing - going back)
		const closingLink = BoundStore.link.getActive("card", "screen-a");
		expect(closingLink?.source.screenKey).toBe("screen-a");
		expect(closingLink?.destination?.screenKey).toBe("screen-b");
	});
});

describe("Scenario: Multiple bounds, only one matches", () => {
	it("establishes link only for matching bound", () => {
		// Screen A has header, card, footer
		BoundStore.entry.set("header", "screen-a", { bounds: createBounds(0, 0) });
		BoundStore.entry.set("card", "screen-a", { bounds: createBounds(0, 100) });
		BoundStore.entry.set("footer", "screen-a", { bounds: createBounds(0, 500) });

		// Only card triggers navigation
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds(0, 100));

		// Screen B only has card
		BoundStore.link.setDestination("attach", "card", "screen-b", createBounds(0, 0));

		// Card link exists
		expect(BoundStore.link.getActive("card")).not.toBeNull();

		// Header and footer have no links (only measured entries)
		expect(BoundStore.link.getActive("header")).toBeNull();
		expect(BoundStore.link.getActive("footer")).toBeNull();
	});
});

describe("Scenario: Nested navigator with ancestor keys", () => {
	it("supports cross-stack bounds via ancestor matching", () => {
		// Tab Navigator structure:
		// - Stack A (key: "stack-a") -> Screen A1 (key: "a1", ancestors: ["stack-a"])
		// - Stack B (key: "stack-b") -> Screen B1 (key: "b1", ancestors: ["stack-b"])

		const boundsA = createBounds(10, 10, 80, 80);
		const boundsB = createBounds(20, 20, 100, 100);

		// Register measured entry in Stack A
		BoundStore.entry.set("profile", "a1", {
			bounds: boundsA,
			ancestorKeys: ["stack-a"],
		});

		// Register measured entry in Stack B
		BoundStore.entry.set("profile", "b1", {
			bounds: boundsB,
			ancestorKeys: ["stack-b"],
		});

		// Query by stack key should return correct bounds
		const fromStackA = BoundStore.entry.getMeasured("profile", "stack-a");
		expect(fromStackA?.bounds).toEqual(boundsA);

		const fromStackB = BoundStore.entry.getMeasured("profile", "stack-b");
		expect(fromStackB?.bounds).toEqual(boundsB);
	});

	it("getActiveLink respects ancestor chain", () => {
		// Navigation from Stack A to detail screen
		BoundStore.link.setSource("capture", "profile", "a1", createBounds(10, 10), {}, [
			"stack-a",
		]);
		BoundStore.link.setDestination("attach", "profile", "detail", createBounds(0, 0));

		// Query by ancestor should find the link
		const link = BoundStore.link.getActive("profile", "stack-a");
		expect(link?.source.screenKey).toBe("a1");
	});
});

describe("Scenario: Rapid navigation A → B → C → pop → pop", () => {
	it("link stack grows and getActiveLink finds correct link for each screen", () => {
		// A → B
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds(0, 0));
		BoundStore.link.setDestination("attach", "card", "screen-b", createBounds(100, 100));

		// B → C
		BoundStore.link.setSource("capture", "card", "screen-b", createBounds(100, 100));
		BoundStore.link.setDestination("attach", "card", "screen-c", createBounds(200, 200));

		// Most recent link is B → C
		const latest = BoundStore.link.getActive("card");
		expect(latest?.source.screenKey).toBe("screen-b");
		expect(latest?.destination?.screenKey).toBe("screen-c");

		// Query from C (destination of B→C) = opening
		const fromC = BoundStore.link.getActive("card", "screen-c");
		expect(fromC?.destination?.screenKey).toBe("screen-c");

		// Query from B - B is source of B→C link, so isClosing=true
		const fromB = BoundStore.link.getActive("card", "screen-b");
		expect(fromB?.source.screenKey).toBe("screen-b");
	});
});

describe("Scenario: Global bounds (fullscreen target)", () => {
	it("getActiveLink with no screenKey returns most recent for fullscreen", () => {
		// Source exists, destination will be fullscreen (no specific screenKey needed)
		BoundStore.link.setSource("capture", 
			"image",
			"gallery",
			createBounds(50, 50, 100, 100),
		);
		BoundStore.link.setDestination("attach", 
			"image",
			"fullscreen-viewer",
			createBounds(0, 0, 400, 800),
		);

		// Fullscreen target can get link without knowing screenKey
		const link = BoundStore.link.getActive("image");
		expect(link).not.toBeNull();
		expect(link?.destination?.screenKey).toBe("fullscreen-viewer");
	});
});
