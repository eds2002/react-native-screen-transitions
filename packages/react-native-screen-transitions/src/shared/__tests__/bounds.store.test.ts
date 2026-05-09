import { beforeEach, describe, expect, it } from "bun:test";
import { applyMeasuredBoundsWrites } from "../components/create-boundary-component/helpers/apply-measured-bounds-writes";
import { BoundStore, type BoundaryConfig, type Snapshot } from "../stores/bounds";

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

const registerMeasuredEntry = (
	tag: string,
	screenKey: string,
	bounds: Snapshot["bounds"],
	styles: Snapshot["styles"] = {},
	ancestorKeys?: string[],
	navigatorKey?: string,
	ancestorNavigatorKeys?: string[],
) => {
	BoundStore.entry.set(tag, screenKey, {
		bounds,
		styles,
		ancestorKeys,
		navigatorKey,
		ancestorNavigatorKeys,
	});
};

const registerBoundaryPresence = (
	tag: string,
	screenKey: string,
	ancestorKeys?: string[],
	boundaryConfig?: BoundaryConfig,
	navigatorKey?: string,
	ancestorNavigatorKeys?: string[],
) => {
	BoundStore.entry.set(tag, screenKey, {
		ancestorKeys,
		boundaryConfig,
		navigatorKey,
		ancestorNavigatorKeys,
	});
};

const hasBoundaryPresence = (tag: string, screenKey: string) => {
	return BoundStore.entry.get(tag, screenKey) !== null;
};

const hasPendingLink = (tag: string) => {
	return BoundStore.link.getPending(tag) !== null;
};

const hasPendingLinkFromSource = (tag: string, sourceScreenKey: string) => {
	return BoundStore.link.getPending(tag, sourceScreenKey) !== null;
};

const getLatestPendingSourceScreenKey = (tag: string) => {
	return BoundStore.link.getPending(tag)?.source.screenKey ?? null;
};

// Reset registry before each test
beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

// =============================================================================
// Unit Tests - entry.set
// =============================================================================

describe("BoundStore.entry.set", () => {
	it("registers new tag with bounds and styles", () => {
		const bounds = createBounds(10, 20, 200, 300);
		const styles = { backgroundColor: "red" };

		registerMeasuredEntry("card", "screen-a", bounds, styles);

		const snapshot = BoundStore.entry.get("card", "screen-a");
		expect(snapshot).not.toBeNull();
		expect(snapshot?.bounds).toEqual(bounds);
		expect(snapshot?.styles).toEqual(styles);
	});

	it("adds snapshot to existing tag", () => {
		const boundsA = createBounds(0, 0, 100, 100);
		const boundsB = createBounds(50, 50, 150, 150);

		registerMeasuredEntry("card", "screen-a", boundsA);
		registerMeasuredEntry("card", "screen-b", boundsB);

		expect(BoundStore.entry.get("card", "screen-a")?.bounds).toEqual(boundsA);
		expect(BoundStore.entry.get("card", "screen-b")?.bounds).toEqual(boundsB);
	});

	it("stores ancestorKeys correctly", () => {
		const bounds = createBounds();
		const ancestors = ["stack-a", "tab-nav"];

		registerMeasuredEntry("card", "screen-a", bounds, {}, ancestors);

		// Verify ancestor matching works
		const viaAncestor = BoundStore.entry.get("card", "stack-a");
		expect(viaAncestor).not.toBeNull();
		expect(viaAncestor?.bounds).toEqual(bounds);
	});

	it("updates existing snapshot on re-measurement", () => {
		const initialBounds = createBounds(0, 0, 100, 100);
		const updatedBounds = createBounds(10, 10, 200, 200);

		registerMeasuredEntry("card", "screen-a", initialBounds);
		registerMeasuredEntry("card", "screen-a", updatedBounds);

		const snapshot = BoundStore.entry.get("card", "screen-a");
		expect(snapshot?.bounds).toEqual(updatedBounds);
	});
});

describe("applyMeasuredBoundsWrites", () => {
	it("writes measured bounds onto an existing presence entry", () => {
		const bounds = createBounds(10, 20, 120, 140);
		const styles = { borderRadius: 12 };

		registerBoundaryPresence("card", "screen-a", ["stack-a"]);

		applyMeasuredBoundsWrites({
			sharedBoundTag: "card",
			currentScreenKey: "screen-a",
			measured: bounds,
			preparedStyles: styles,
			ancestorKeys: ["stack-a"],
		});

		const snapshot = BoundStore.entry.get("card", "screen-a");
		const ancestorSnapshot = BoundStore.entry.get("card", "stack-a");
		expect(snapshot?.bounds).toEqual(bounds);
		expect(snapshot?.styles).toEqual({});
		expect(ancestorSnapshot?.bounds).toEqual(bounds);
	});

	it("writes a snapshot when capturing a source link", () => {
		const bounds = createBounds(25, 35, 150, 160);
		const styles = { borderRadius: 16 };

		applyMeasuredBoundsWrites({
			sharedBoundTag: "card",
			currentScreenKey: "screen-a",
			measured: bounds,
			preparedStyles: styles,
			ancestorKeys: ["stack-a"],
			shouldSetSource: true,
		});

		const link = BoundStore.link.getActive("card");
		const snapshot = BoundStore.entry.get("card", "screen-a");
		expect(link?.source.bounds).toEqual(bounds);
		expect(link?.source.styles).toEqual(styles);
		expect(snapshot?.bounds).toEqual(bounds);
		expect(snapshot?.styles).toEqual({});
	});
});

// =============================================================================
// Unit Tests - link.setSource / link.setDestination
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

describe("BoundStore.link.setSource refresh", () => {
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
// Unit Tests - entry.get
// =============================================================================

describe("BoundStore.entry.get", () => {
	it("returns null for unknown tag", () => {
		const result = BoundStore.entry.get("unknown", "screen-a");
		expect(result).toBeNull();
	});

	it("returns bounds and styles for direct key match", () => {
		const bounds = createBounds(10, 20, 300, 400);
		const styles = { borderRadius: 8 };

		registerMeasuredEntry("card", "screen-a", bounds, styles);

		const result = BoundStore.entry.get("card", "screen-a");
		expect(result).toEqual({ bounds, styles });
	});

	it("returns bounds via ancestor match", () => {
		const bounds = createBounds();
		const ancestors = ["stack-a", "root"];

		registerMeasuredEntry("card", "screen-a", bounds, {}, ancestors);

		// Query by ancestor key
		const result = BoundStore.entry.get("card", "stack-a");
		expect(result).not.toBeNull();
		expect(result?.bounds).toEqual(bounds);
	});

	it("prefers direct match over ancestor match", () => {
		const directBounds = createBounds(0, 0, 100, 100);
		const ancestorBounds = createBounds(200, 200, 50, 50);

		// Register with ancestor that matches another screen's key
		registerMeasuredEntry("card", "screen-a", ancestorBounds, {}, [
			"stack-a",
		]);
		registerMeasuredEntry("card", "stack-a", directBounds);

		// Direct match should win
		const result = BoundStore.entry.get("card", "stack-a");
		expect(result?.bounds).toEqual(directBounds);
	});
});

// =============================================================================
// Unit Tests - link.getActive
// =============================================================================

describe("BoundStore.link.getActive", () => {
	it("returns null for unknown tag", () => {
		const result = BoundStore.link.getActive("unknown");
		expect(result).toBeNull();
	});

	it("returns null for empty linkStack", () => {
		// Register snapshot but no links
		registerMeasuredEntry("card", "screen-a", createBounds());

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

	it("entering falls back to completed link whose source matches previous", () => {
		const source = createBounds(10, 20, 100, 100);
		const destination = createBounds(300, 320, 180, 180);

		BoundStore.link.setSource("capture", "card", "screen-a", source);
		BoundStore.link.setDestination("attach", "card", "screen-c", destination);

		const resolved = BoundStore.link.getPair("card", {
			entering: true,
			currentScreenKey: "screen-b",
			previousScreenKey: "screen-a",
		});

		expect(resolved.sourceBounds).toEqual(source);
		expect(resolved.destinationBounds).toEqual(destination);
	});

	it("entering ignores next screen fallback", () => {
		const source = createBounds(30, 40, 100, 100);
		const destination = createBounds(400, 420, 180, 180);

		BoundStore.link.setSource("capture", "card", "screen-c", source);
		BoundStore.link.setDestination("attach", "card", "screen-d", destination);

		const resolved = BoundStore.link.getPair("card", {
			entering: true,
			currentScreenKey: "screen-b",
			previousScreenKey: "screen-a",
			nextScreenKey: "screen-d",
		});

		expect(resolved.sourceBounds).toBeNull();
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

	it("exiting falls back to completed link whose destination matches next", () => {
		const source = createBounds(10, 20, 100, 100);
		const destination = createBounds(200, 220, 180, 180);

		BoundStore.link.setSource("capture", "card", "screen-a", source);
		BoundStore.link.setDestination("attach", "card", "screen-b", destination);

		const resolved = BoundStore.link.getPair("card", {
			entering: false,
			currentScreenKey: "screen-c",
			nextScreenKey: "screen-b",
		});

		expect(resolved.sourceBounds).toEqual(source);
		expect(resolved.destinationBounds).toEqual(destination);
	});

	it("exiting falls back to pending current source without inventing a destination", () => {
		const source = createBounds(40, 50, 100, 100);

		BoundStore.link.setSource("capture", "card", "screen-b", source);

		const resolved = BoundStore.link.getPair("card", {
			entering: false,
			currentScreenKey: "screen-b",
			nextScreenKey: "screen-a",
		});

		expect(resolved.sourceBounds).toEqual(source);
		expect(resolved.destinationBounds).toBeNull();
	});

	it("ignores snapshot-only recovery when no live link exists", () => {
		const sourceSnapshot = createBounds(12, 24, 80, 90);
		const destinationSnapshot = createBounds(40, 50, 200, 210);

		registerMeasuredEntry("card", "screen-a", sourceSnapshot);

		const sourceOnly = BoundStore.link.getPair("card", {
			entering: true,
			previousScreenKey: "screen-a",
			currentScreenKey: "screen-b",
		});

		expect(sourceOnly.sourceBounds).toBeNull();
		expect(sourceOnly.destinationBounds).toBeNull();

		registerMeasuredEntry("card", "screen-b", destinationSnapshot);

		const sourceAndDestination = BoundStore.link.getPair("card", {
			entering: true,
			previousScreenKey: "screen-a",
			currentScreenKey: "screen-b",
		});

		expect(sourceAndDestination.sourceBounds).toBeNull();
		expect(sourceAndDestination.destinationBounds).toBeNull();
	});

});

describe("BoundStore link predicates", () => {
	it("hasPendingLink returns true when destination is missing", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds());

		expect(hasPendingLink("card")).toBe(true);
	});

	it("hasPendingLink returns false when latest links are complete", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds());
		BoundStore.link.setDestination("attach", "card", "screen-b", createBounds());

		expect(hasPendingLink("card")).toBe(false);
	});

	it("hasPendingLinkFromSource matches pending source screen", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds());
		BoundStore.link.setSource("capture", "card", "screen-b", createBounds());

		expect(hasPendingLinkFromSource("card", "screen-a")).toBe(true);
		expect(hasPendingLinkFromSource("card", "screen-b")).toBe(true);
		expect(hasPendingLinkFromSource("card", "screen-x")).toBe(
			false,
		);
	});

	it("hasPendingLinkFromSource supports ancestor matching", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds(), {}, ["stack-a"]);

		expect(hasPendingLinkFromSource("card", "stack-a")).toBe(true);
	});

	it("getLatestPendingSourceScreenKey returns most recent pending source", () => {
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds());
		BoundStore.link.setSource("capture", "card", "screen-b", createBounds());

		expect(getLatestPendingSourceScreenKey("card")).toBe("screen-b");

		BoundStore.link.setDestination("attach", "card", "screen-c", createBounds());
		expect(getLatestPendingSourceScreenKey("card")).toBe("screen-a");
	});

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

describe("BoundStore boundary presence", () => {
	it("tracks boundary presence by tag and screen", () => {
		registerBoundaryPresence("card", "screen-a");

		expect(hasBoundaryPresence("card", "screen-a")).toBe(true);
		expect(hasBoundaryPresence("card", "screen-b")).toBe(false);
	});

	it("supports ancestor matching for boundary presence", () => {
		registerBoundaryPresence("card", "screen-a", ["stack-a"]);

		expect(hasBoundaryPresence("card", "stack-a")).toBe(true);
	});

	it("removes boundary presence by tag and screen", () => {
		registerBoundaryPresence("card", "screen-a");

		BoundStore.entry.remove("card", "screen-a");
		expect(hasBoundaryPresence("card", "screen-a")).toBe(false);
	});

	it("clear removes boundary presence for a screen", () => {
		registerBoundaryPresence("card", "screen-a");
		registerBoundaryPresence("card", "screen-b");

		BoundStore.cleanup.byScreen("screen-a");

		expect(hasBoundaryPresence("card", "screen-a")).toBe(false);
		expect(hasBoundaryPresence("card", "screen-b")).toBe(true);
	});

	it("stores boundary config and retrieves it by direct screen key", () => {
		registerBoundaryPresence("card", "screen-a", undefined, {
			anchor: "top",
			scaleMode: "uniform",
			target: "fullscreen",
			method: "content",
		});

		expect(
			BoundStore.entry.get("card", "screen-a")?.boundaryConfig ?? null,
		).toEqual({
			anchor: "top",
			scaleMode: "uniform",
			target: "fullscreen",
			method: "content",
		});
	});

	it("updates boundary config when re-registering same screen", () => {
		registerBoundaryPresence("card", "screen-a", undefined, {
			anchor: "center",
			method: "transform",
		});

		registerBoundaryPresence("card", "screen-a", undefined, {
			anchor: "bottom",
			method: "size",
		});

		expect(
			BoundStore.entry.get("card", "screen-a")?.boundaryConfig ?? null,
		).toEqual({
			anchor: "bottom",
			method: "size",
		});
	});

	it("supports ancestor matching for boundary config", () => {
		registerBoundaryPresence("card", "screen-a", ["stack-a"], {
			anchor: "topLeading",
			scaleMode: "match",
		});

		expect(
			BoundStore.entry.get("card", "stack-a")?.boundaryConfig ?? null,
		).toEqual({
			anchor: "topLeading",
			scaleMode: "match",
		});
	});

	it("clear removes boundary config for the cleared screen", () => {
		registerBoundaryPresence("card", "screen-a", undefined, {
			anchor: "top",
		});
		registerBoundaryPresence("card", "screen-b", undefined, {
			anchor: "bottom",
		});

		BoundStore.cleanup.byScreen("screen-a");

		expect(
			BoundStore.entry.get("card", "screen-a")?.boundaryConfig ?? null,
		).toBeNull();
		expect(
			BoundStore.entry.get("card", "screen-b")?.boundaryConfig ?? null,
		).toEqual({
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
		registerMeasuredEntry("header", "screen-a", createBounds(0, 0));
		registerMeasuredEntry("card", "screen-a", createBounds(0, 100));
		registerMeasuredEntry("footer", "screen-a", createBounds(0, 500));

		// Only card triggers navigation
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds(0, 100));

		// Screen B only has card
		BoundStore.link.setDestination("attach", "card", "screen-b", createBounds(0, 0));

		// Card link exists
		expect(BoundStore.link.getActive("card")).not.toBeNull();

		// Header and footer have no links (only snapshots)
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

		// Register snapshot in Stack A
		registerMeasuredEntry("profile", "a1", boundsA, {}, ["stack-a"]);

		// Register snapshot in Stack B
		registerMeasuredEntry("profile", "b1", boundsB, {}, ["stack-b"]);

		// Query by stack key should return correct bounds
		const fromStackA = BoundStore.entry.get("profile", "stack-a");
		expect(fromStackA?.bounds).toEqual(boundsA);

		const fromStackB = BoundStore.entry.get("profile", "stack-b");
		expect(fromStackB?.bounds).toEqual(boundsB);
	});

	it("link.getActive respects ancestor chain", () => {
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
	it("link stack grows and link.getActive finds correct link for each screen", () => {
		// A → B
		BoundStore.link.setSource("capture", "card", "screen-a", createBounds(0, 0));
		BoundStore.link.setDestination(
			"attach",
			"card",
			"screen-b",
			createBounds(100, 100),
		);

		// B → C
		BoundStore.link.setSource(
			"capture",
			"card",
			"screen-b",
			createBounds(100, 100),
		);
		BoundStore.link.setDestination(
			"attach",
			"card",
			"screen-c",
			createBounds(200, 200),
		);

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

	it("retains deep nested history until branch cleanup runs", () => {
		const screens = ["screen-a", "screen-b", "screen-c", "screen-d", "screen-e"];

		for (let i = 0; i < screens.length - 1; i++) {
			const sourceScreenKey = screens[i];
			const destinationScreenKey = screens[i + 1];

			BoundStore.link.setSource(
				"capture",
				"card",
				sourceScreenKey,
				createBounds(i * 100, i * 100),
				{},
				["nested"],
			);
			BoundStore.link.setDestination(
				"attach",
				"card",
				destinationScreenKey,
				createBounds((i + 1) * 100, (i + 1) * 100),
				{},
				["nested"],
			);
		}

		expect(BoundStore.link.getActive("card", "screen-a")?.source.screenKey).toBe(
			"screen-a",
		);
		expect(
			BoundStore.link.getActive("card", "screen-e")?.destination?.screenKey,
		).toBe("screen-e");

		BoundStore.cleanup.byAncestor("nested");

		expect(BoundStore.link.getActive("card", "screen-a")).toBeNull();
		expect(BoundStore.link.getActive("card", "screen-b")).toBeNull();
		expect(BoundStore.link.getActive("card", "screen-e")).toBeNull();
	});
});

describe("Scenario: Global bounds (fullscreen target)", () => {
	it("link.getActive with no screenKey returns most recent for fullscreen", () => {
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
