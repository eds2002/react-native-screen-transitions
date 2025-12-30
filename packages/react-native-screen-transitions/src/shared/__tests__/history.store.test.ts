import { beforeEach, describe, expect, it } from "bun:test";
import { HistoryStore } from "../stores/history.store";
import type { BaseStackDescriptor } from "../types/stack.types";

// Helper to create mock descriptors
const createDescriptor = (
	name: string,
	navigatorKey = "nav-1",
): BaseStackDescriptor =>
	({
		route: { key: `${name}-instance`, name },
		navigation: { getState: () => ({ key: navigatorKey }) },
		options: {},
		render: () => null,
	}) as unknown as BaseStackDescriptor;

// Helper to generate expected history key
const historyKey = (name: string, navigatorKey = "nav-1") =>
	`${navigatorKey}:${name}`;

// Reset history before each test
beforeEach(() => {
	HistoryStore._reset();
});

// =============================================================================
// Unit Tests - focus (LRU behavior)
// =============================================================================

describe("HistoryStore.focus - LRU behavior", () => {
	it("adds new screen to history", () => {
		const descriptor = createDescriptor("screen-a");

		HistoryStore.focus(descriptor, "nav-1");

		expect(HistoryStore.has(historyKey("screen-a"))).toBe(true);
		expect(HistoryStore.size()).toBe(1);
	});

	it("adds multiple screens in order", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		HistoryStore.focus(createDescriptor("b"), "nav-1");
		HistoryStore.focus(createDescriptor("c"), "nav-1");

		const entries = HistoryStore.toArray();
		expect(entries.length).toBe(3);
		expect(entries[0].descriptor.route.name).toBe("a"); // oldest
		expect(entries[1].descriptor.route.name).toBe("b");
		expect(entries[2].descriptor.route.name).toBe("c"); // most recent
	});

	it("moves existing screen to top (LRU reorder)", () => {
		// Initial order: [A, B, C, D, E]
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		HistoryStore.focus(createDescriptor("b"), "nav-1");
		HistoryStore.focus(createDescriptor("c"), "nav-1");
		HistoryStore.focus(createDescriptor("d"), "nav-1");
		HistoryStore.focus(createDescriptor("e"), "nav-1");

		// Focus B again - should move to top
		HistoryStore.focus(createDescriptor("b"), "nav-1");

		const entries = HistoryStore.toArray();
		expect(entries.length).toBe(5); // No duplicates
		expect(entries.map((e) => e.descriptor.route.name)).toEqual([
			"a",
			"c",
			"d",
			"e",
			"b", // B moved to top
		]);
	});

	it("LRU reorder - complex scenario (browser history simulation)", () => {
		// Simulate: Click b1, b2, b3, b4, b5
		HistoryStore.focus(createDescriptor("b1"), "nav-1");
		HistoryStore.focus(createDescriptor("b2"), "nav-1");
		HistoryStore.focus(createDescriptor("b3"), "nav-1");
		HistoryStore.focus(createDescriptor("b4"), "nav-1");
		HistoryStore.focus(createDescriptor("b5"), "nav-1");

		expect(HistoryStore.toArray().map((e) => e.descriptor.route.name)).toEqual([
			"b1",
			"b2",
			"b3",
			"b4",
			"b5",
		]);

		// Click b1 again - moves to top, removed from original position
		HistoryStore.focus(createDescriptor("b1"), "nav-1");

		expect(HistoryStore.toArray().map((e) => e.descriptor.route.name)).toEqual([
			"b2", // b1 was here, now gone
			"b3",
			"b4",
			"b5",
			"b1", // b1 moved to top
		]);

		// Click b2 - moves to top
		HistoryStore.focus(createDescriptor("b2"), "nav-1");

		expect(HistoryStore.toArray().map((e) => e.descriptor.route.name)).toEqual([
			"b3", // b2 was here, now gone
			"b4",
			"b5",
			"b1",
			"b2", // b2 moved to top
		]);
	});

	it("updates descriptor when refocusing", () => {
		const original = createDescriptor("a");
		const updated = {
			...createDescriptor("a"),
			options: { title: "Updated" },
		} as unknown as BaseStackDescriptor;

		HistoryStore.focus(original, "nav-1");
		HistoryStore.focus(updated, "nav-1");

		const entry = HistoryStore.get(historyKey("a"));
		expect(entry?.descriptor.options).toEqual({ title: "Updated" });
	});
});

// =============================================================================
// Unit Tests - Limit / Eviction
// =============================================================================

describe("HistoryStore - limit and eviction", () => {
	it("evicts oldest when limit exceeded", () => {
		// Add 101 entries (limit is 100)
		for (let i = 0; i < 101; i++) {
			HistoryStore.focus(createDescriptor(`screen-${i}`), "nav-1");
		}

		expect(HistoryStore.size()).toBe(100);
		expect(HistoryStore.has(historyKey("screen-0"))).toBe(false); // Oldest evicted
		expect(HistoryStore.has(historyKey("screen-1"))).toBe(true); // Second oldest kept
		expect(HistoryStore.has(historyKey("screen-100"))).toBe(true); // Most recent kept
	});

	it("evicts multiple when way over limit", () => {
		// Add 105 entries
		for (let i = 0; i < 105; i++) {
			HistoryStore.focus(createDescriptor(`screen-${i}`), "nav-1");
		}

		expect(HistoryStore.size()).toBe(100);
		expect(HistoryStore.has(historyKey("screen-0"))).toBe(false);
		expect(HistoryStore.has(historyKey("screen-4"))).toBe(false);
		expect(HistoryStore.has(historyKey("screen-5"))).toBe(true);
	});

	it("refocusing does not cause extra eviction", () => {
		// Add 99 entries
		for (let i = 0; i < 99; i++) {
			HistoryStore.focus(createDescriptor(`screen-${i}`), "nav-1");
		}

		// Refocus an existing entry - should not trigger eviction
		HistoryStore.focus(createDescriptor("screen-50"), "nav-1");

		expect(HistoryStore.size()).toBe(99);
		expect(HistoryStore.has(historyKey("screen-0"))).toBe(true);
	});
});

// =============================================================================
// Unit Tests - Query methods
// =============================================================================

describe("HistoryStore.getMostRecent", () => {
	it("returns undefined when empty", () => {
		expect(HistoryStore.getMostRecent()).toBeUndefined();
	});

	it("returns most recent entry", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		HistoryStore.focus(createDescriptor("b"), "nav-1");
		HistoryStore.focus(createDescriptor("c"), "nav-1");

		const recent = HistoryStore.getMostRecent();
		expect(recent?.descriptor.route.name).toBe("c");
	});

	it("returns newly focused entry after LRU reorder", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		HistoryStore.focus(createDescriptor("b"), "nav-1");
		HistoryStore.focus(createDescriptor("a"), "nav-1"); // Refocus A

		const recent = HistoryStore.getMostRecent();
		expect(recent?.descriptor.route.name).toBe("a");
	});
});

describe("HistoryStore.getRecent", () => {
	it("returns empty array when empty", () => {
		expect(HistoryStore.getRecent(5)).toEqual([]);
	});

	it("returns N most recent entries (most recent first)", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		HistoryStore.focus(createDescriptor("b"), "nav-1");
		HistoryStore.focus(createDescriptor("c"), "nav-1");
		HistoryStore.focus(createDescriptor("d"), "nav-1");

		const recent = HistoryStore.getRecent(2);
		expect(recent.length).toBe(2);
		expect(recent[0].descriptor.route.name).toBe("d"); // Most recent first
		expect(recent[1].descriptor.route.name).toBe("c");
	});

	it("returns all if N > size", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		HistoryStore.focus(createDescriptor("b"), "nav-1");

		const recent = HistoryStore.getRecent(10);
		expect(recent.length).toBe(2);
	});
});

describe("HistoryStore.get / has", () => {
	it("get returns undefined for unknown key", () => {
		expect(HistoryStore.get("unknown")).toBeUndefined();
	});

	it("has returns false for unknown key", () => {
		expect(HistoryStore.has("unknown")).toBe(false);
	});

	it("get returns entry for known key", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");

		const entry = HistoryStore.get(historyKey("a"));
		expect(entry).toBeDefined();
		expect(entry?.descriptor.route.name).toBe("a");
		expect(entry?.navigatorKey).toBe("nav-1");
	});

	it("has returns true for known key", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		expect(HistoryStore.has(historyKey("a"))).toBe(true);
	});
});

// =============================================================================
// Unit Tests - Navigator scoped queries
// =============================================================================

describe("HistoryStore.getByNavigator", () => {
	it("returns empty array for unknown navigator", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");

		expect(HistoryStore.getByNavigator("nav-2")).toEqual([]);
	});

	it("returns entries for specific navigator only", () => {
		HistoryStore.focus(createDescriptor("a", "nav-1"), "nav-1");
		HistoryStore.focus(createDescriptor("b", "nav-2"), "nav-2");
		HistoryStore.focus(createDescriptor("c", "nav-1"), "nav-1");
		HistoryStore.focus(createDescriptor("d", "nav-2"), "nav-2");

		const nav1 = HistoryStore.getByNavigator("nav-1");
		expect(nav1.length).toBe(2);
		expect(nav1.map((e) => e.descriptor.route.name)).toEqual(["c", "a"]); // Most recent first

		const nav2 = HistoryStore.getByNavigator("nav-2");
		expect(nav2.length).toBe(2);
		expect(nav2.map((e) => e.descriptor.route.name)).toEqual(["d", "b"]);
	});

	it("returns in recency order (most recent first)", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		HistoryStore.focus(createDescriptor("b"), "nav-1");
		HistoryStore.focus(createDescriptor("c"), "nav-1");

		const entries = HistoryStore.getByNavigator("nav-1");
		expect(entries[0].descriptor.route.name).toBe("c"); // Most recent
		expect(entries[2].descriptor.route.name).toBe("a"); // Oldest
	});
});

describe("HistoryStore.clearNavigator", () => {
	it("removes all entries for specified navigator", () => {
		HistoryStore.focus(createDescriptor("a", "nav-1"), "nav-1");
		HistoryStore.focus(createDescriptor("b", "nav-2"), "nav-2");
		HistoryStore.focus(createDescriptor("c", "nav-1"), "nav-1");

		HistoryStore.clearNavigator("nav-1");

		expect(HistoryStore.size()).toBe(1);
		expect(HistoryStore.has(historyKey("a", "nav-1"))).toBe(false);
		expect(HistoryStore.has(historyKey("c", "nav-1"))).toBe(false);
		expect(HistoryStore.has(historyKey("b", "nav-2"))).toBe(true);
	});

	it("does nothing for unknown navigator", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");

		HistoryStore.clearNavigator("nav-unknown");

		expect(HistoryStore.size()).toBe(1);
	});
});

// =============================================================================
// Unit Tests - getPath (for multi-waypoint interpolation)
// =============================================================================

describe("HistoryStore.getPath", () => {
	it("returns empty array if fromKey not found", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		HistoryStore.focus(createDescriptor("b"), "nav-1");

		expect(HistoryStore.getPath("unknown", historyKey("b"))).toEqual([]);
	});

	it("returns empty array if toKey not found", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		HistoryStore.focus(createDescriptor("b"), "nav-1");

		expect(HistoryStore.getPath(historyKey("a"), "unknown")).toEqual([]);
	});

	it("returns path from older to newer (forward direction)", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		HistoryStore.focus(createDescriptor("b"), "nav-1");
		HistoryStore.focus(createDescriptor("c"), "nav-1");
		HistoryStore.focus(createDescriptor("d"), "nav-1");
		HistoryStore.focus(createDescriptor("e"), "nav-1");

		const path = HistoryStore.getPath(historyKey("a"), historyKey("e"));
		expect(path).toEqual([
			historyKey("a"),
			historyKey("b"),
			historyKey("c"),
			historyKey("d"),
			historyKey("e"),
		]);
	});

	it("returns path from newer to older (backward direction)", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		HistoryStore.focus(createDescriptor("b"), "nav-1");
		HistoryStore.focus(createDescriptor("c"), "nav-1");
		HistoryStore.focus(createDescriptor("d"), "nav-1");
		HistoryStore.focus(createDescriptor("e"), "nav-1");

		const path = HistoryStore.getPath(historyKey("e"), historyKey("a"));
		expect(path).toEqual([
			historyKey("e"),
			historyKey("d"),
			historyKey("c"),
			historyKey("b"),
			historyKey("a"),
		]);
	});

	it("returns path for partial range", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		HistoryStore.focus(createDescriptor("b"), "nav-1");
		HistoryStore.focus(createDescriptor("c"), "nav-1");
		HistoryStore.focus(createDescriptor("d"), "nav-1");
		HistoryStore.focus(createDescriptor("e"), "nav-1");

		const path = HistoryStore.getPath(historyKey("b"), historyKey("d"));
		expect(path).toEqual([historyKey("b"), historyKey("c"), historyKey("d")]);
	});

	it("returns single key if from === to", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		HistoryStore.focus(createDescriptor("b"), "nav-1");

		const path = HistoryStore.getPath(historyKey("b"), historyKey("b"));
		expect(path).toEqual([historyKey("b")]);
	});

	it("respects LRU reordering in path", () => {
		// Initial: [A, B, C, D, E]
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		HistoryStore.focus(createDescriptor("b"), "nav-1");
		HistoryStore.focus(createDescriptor("c"), "nav-1");
		HistoryStore.focus(createDescriptor("d"), "nav-1");
		HistoryStore.focus(createDescriptor("e"), "nav-1");

		// Refocus B - now: [A, C, D, E, B]
		HistoryStore.focus(createDescriptor("b"), "nav-1");

		// Path from A to B should reflect new order
		const path = HistoryStore.getPath(historyKey("a"), historyKey("b"));
		expect(path).toEqual([
			historyKey("a"),
			historyKey("c"),
			historyKey("d"),
			historyKey("e"),
			historyKey("b"),
		]);
	});
});

// =============================================================================
// Scenario Tests - Navigation Flows
// =============================================================================

describe("Scenario: DismissAll interpolation", () => {
	it("provides path for dismissAll from E to A", () => {
		// Navigate: A → B → C → D → E
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		HistoryStore.focus(createDescriptor("b"), "nav-1");
		HistoryStore.focus(createDescriptor("c"), "nav-1");
		HistoryStore.focus(createDescriptor("d"), "nav-1");
		HistoryStore.focus(createDescriptor("e"), "nav-1");

		// DismissAll from E to A - need path for interpolation
		const path = HistoryStore.getPath(historyKey("e"), historyKey("a"));
		expect(path).toEqual([
			historyKey("e"),
			historyKey("d"),
			historyKey("c"),
			historyKey("b"),
			historyKey("a"),
		]);
	});
});

describe("Scenario: Forward navigation", () => {
	it("dismissed screen remains in history for forward nav", () => {
		// Navigate: A → B → C
		HistoryStore.focus(createDescriptor("a"), "nav-1");
		HistoryStore.focus(createDescriptor("b"), "nav-1");
		HistoryStore.focus(createDescriptor("c"), "nav-1");

		// Simulate going back to B (C dismissed but NOT removed from history)
		HistoryStore.focus(createDescriptor("b"), "nav-1");

		// C is still in history (before B since B was just refocused)
		expect(HistoryStore.has(historyKey("c"))).toBe(true);

		// Order is now [A, C, B] - C didn't move, B moved to top
		const entries = HistoryStore.toArray();
		expect(entries.map((e) => e.descriptor.route.name)).toEqual([
			"a",
			"c",
			"b",
		]);

		// For forward nav, we could go back to C
		// (In practice, forward nav would look at what was most recent before B)
	});
});

describe("Scenario: Cross-navigator history", () => {
	it("maintains global order across navigators", () => {
		// Tab 1: A → B
		HistoryStore.focus(createDescriptor("a", "tab-1"), "tab-1");
		HistoryStore.focus(createDescriptor("b", "tab-1"), "tab-1");

		// Switch to Tab 2: C → D
		HistoryStore.focus(createDescriptor("c", "tab-2"), "tab-2");
		HistoryStore.focus(createDescriptor("d", "tab-2"), "tab-2");

		// Switch back to Tab 1, focus A
		HistoryStore.focus(createDescriptor("a", "tab-1"), "tab-1");

		// Global order: [B, C, D, A]
		const entries = HistoryStore.toArray();
		expect(entries.map((e) => e.descriptor.route.name)).toEqual([
			"b",
			"c",
			"d",
			"a",
		]);

		// Tab-specific order
		const tab1 = HistoryStore.getByNavigator("tab-1");
		expect(tab1.map((e) => e.descriptor.route.name)).toEqual(["a", "b"]);

		const tab2 = HistoryStore.getByNavigator("tab-2");
		expect(tab2.map((e) => e.descriptor.route.name)).toEqual(["d", "c"]);
	});

	it("getMostRecent returns globally most recent regardless of navigator", () => {
		HistoryStore.focus(createDescriptor("a", "tab-1"), "tab-1");
		HistoryStore.focus(createDescriptor("b", "tab-2"), "tab-2");
		HistoryStore.focus(createDescriptor("c", "tab-1"), "tab-1");

		expect(HistoryStore.getMostRecent()?.descriptor.route.name).toBe("c");
		expect(HistoryStore.getMostRecent()?.navigatorKey).toBe("tab-1");
	});
});

describe("Scenario: Nested navigator cleanup", () => {
	it("modal navigator cleanup does not affect parent", () => {
		// Parent stack
		HistoryStore.focus(createDescriptor("home", "stack-main"), "stack-main");
		HistoryStore.focus(
			createDescriptor("details", "stack-main"),
			"stack-main",
		);

		// Modal opens with its own navigator
		HistoryStore.focus(
			createDescriptor("modal-a", "stack-modal"),
			"stack-modal",
		);
		HistoryStore.focus(
			createDescriptor("modal-b", "stack-modal"),
			"stack-modal",
		);

		expect(HistoryStore.size()).toBe(4);

		// Modal closes - cleanup modal navigator
		HistoryStore.clearNavigator("stack-modal");

		expect(HistoryStore.size()).toBe(2);
		expect(HistoryStore.has(historyKey("home", "stack-main"))).toBe(true);
		expect(HistoryStore.has(historyKey("details", "stack-main"))).toBe(true);
		expect(HistoryStore.has(historyKey("modal-a", "stack-modal"))).toBe(false);
		expect(HistoryStore.has(historyKey("modal-b", "stack-modal"))).toBe(false);
	});
});

// =============================================================================
// Unit Tests - Subscribe / Snapshot (for React integration)
// =============================================================================

describe("HistoryStore.subscribe / getSnapshot", () => {
	it("getSnapshot returns current state", () => {
		HistoryStore.focus(createDescriptor("a"), "nav-1");

		const snapshot = HistoryStore.getSnapshot();
		expect(snapshot.size).toBe(1);
		expect(snapshot.get(historyKey("a"))).toBeDefined();
	});

	it("snapshot is updated after focus", () => {
		const snapshot1 = HistoryStore.getSnapshot();
		expect(snapshot1.size).toBe(0);

		HistoryStore.focus(createDescriptor("a"), "nav-1");

		const snapshot2 = HistoryStore.getSnapshot();
		expect(snapshot2.size).toBe(1);
		expect(snapshot1).not.toBe(snapshot2); // New reference
	});
});
