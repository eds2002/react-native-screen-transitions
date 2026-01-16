import { describe, expect, it } from "bun:test";

/**
 * Simulates the ancestor gesture context chain.
 * This mirrors the structure in GestureContextType.
 */
interface MockAncestorContext {
	gestureEnabled: boolean;
	isIsolated: boolean;
	panGesture: string | null; // Using string as a stand-in for GestureType
	ancestorContext: MockAncestorContext | null;
}

/**
 * Pure function that implements the ancestor collection logic from use-build-gestures.tsx.
 * Extracted here for testing purposes.
 *
 * This collects ALL ancestor pan gestures while respecting isolation boundaries:
 * - Non-isolated screens propagate to all ancestors
 * - Isolated screens stop at isolation boundary (when ancestor is not isolated)
 */
function collectAncestorPanGestures(
	ancestorContext: MockAncestorContext | null,
	isCurrentScreenIsolated: boolean,
): string[] {
	const ancestorPanGestures: string[] = [];
	let currentAncestor = ancestorContext;

	while (currentAncestor) {
		// Stop at isolation boundary: we're isolated, ancestor is not
		if (isCurrentScreenIsolated && !currentAncestor.isIsolated) {
			break;
		}

		if (currentAncestor.gestureEnabled && currentAncestor.panGesture) {
			ancestorPanGestures.push(currentAncestor.panGesture);
		}

		currentAncestor = currentAncestor.ancestorContext;
	}

	return ancestorPanGestures;
}

/** Helper to build an ancestor chain from an array of configs (innermost first) */
function buildAncestorChain(
	configs: Array<{
		gestureEnabled: boolean;
		isIsolated: boolean;
		panGesture: string | null;
	}>,
): MockAncestorContext | null {
	let chain: MockAncestorContext | null = null;

	// Build from outermost to innermost
	for (let i = configs.length - 1; i >= 0; i--) {
		chain = {
			...configs[i],
			ancestorContext: chain,
		};
	}

	return chain;
}

describe("collectAncestorPanGestures", () => {
	describe("non-isolated screen (propagates to all)", () => {
		it("collects all ancestors with gestures enabled", () => {
			// Scenario:
			// SessionId (non-isolated, vertical) -> ScreenA (non-isolated, horizontal) -> Current (non-isolated)
			const ancestors = buildAncestorChain([
				{ gestureEnabled: true, isIsolated: false, panGesture: "screenA-pan" },
				{ gestureEnabled: true, isIsolated: false, panGesture: "sessionId-pan" },
			]);

			const result = collectAncestorPanGestures(ancestors, false);

			expect(result).toEqual(["screenA-pan", "sessionId-pan"]);
		});

		it("skips ancestors without gestures but continues propagating", () => {
			// Scenario: middle screen has gestureEnabled: false
			const ancestors = buildAncestorChain([
				{ gestureEnabled: false, isIsolated: false, panGesture: null },
				{ gestureEnabled: true, isIsolated: false, panGesture: "outer-pan" },
			]);

			const result = collectAncestorPanGestures(ancestors, false);

			expect(result).toEqual(["outer-pan"]);
		});

		it("returns empty array when no ancestors have gestures", () => {
			const ancestors = buildAncestorChain([
				{ gestureEnabled: false, isIsolated: false, panGesture: null },
				{ gestureEnabled: false, isIsolated: false, panGesture: null },
			]);

			const result = collectAncestorPanGestures(ancestors, false);

			expect(result).toEqual([]);
		});

		it("returns empty array when no ancestors exist", () => {
			const result = collectAncestorPanGestures(null, false);

			expect(result).toEqual([]);
		});
	});

	describe("isolated screen (stops at boundary)", () => {
		it("stops before non-isolated ancestor", () => {
			// Scenario:
			// SessionId (non-isolated) -> ScreenA (non-isolated) -> ComponentStack screen (isolated)
			//
			// The ComponentStack screen should NOT collect SessionId or ScreenA gestures
			const ancestors = buildAncestorChain([
				{ gestureEnabled: true, isIsolated: false, panGesture: "screenA-pan" },
				{ gestureEnabled: true, isIsolated: false, panGesture: "sessionId-pan" },
			]);

			const result = collectAncestorPanGestures(ancestors, true);

			// Should stop immediately - first ancestor is not isolated
			expect(result).toEqual([]);
		});

		it("collects isolated ancestors before hitting non-isolated boundary", () => {
			// Scenario:
			// SessionId (non-isolated) -> ComponentStack ScreenX (isolated, has snap) -> ComponentStack ScreenY (isolated)
			//
			// ScreenY should collect ScreenX's gestures but not SessionId's
			const ancestors = buildAncestorChain([
				{ gestureEnabled: true, isIsolated: true, panGesture: "screenX-snap-pan" },
				{ gestureEnabled: true, isIsolated: false, panGesture: "sessionId-pan" },
			]);

			const result = collectAncestorPanGestures(ancestors, true);

			expect(result).toEqual(["screenX-snap-pan"]);
		});

		it("collects multiple isolated ancestors", () => {
			// Scenario: deeply nested isolated stacks (edge case)
			// Non-isolated -> Isolated A -> Isolated B -> Current (isolated)
			const ancestors = buildAncestorChain([
				{ gestureEnabled: true, isIsolated: true, panGesture: "isolatedB-pan" },
				{ gestureEnabled: true, isIsolated: true, panGesture: "isolatedA-pan" },
				{ gestureEnabled: true, isIsolated: false, panGesture: "outer-pan" },
			]);

			const result = collectAncestorPanGestures(ancestors, true);

			expect(result).toEqual(["isolatedB-pan", "isolatedA-pan"]);
		});

		it("skips isolated ancestors without gestures but continues within isolation", () => {
			// Scenario: isolated ancestor without gestures, followed by another isolated with gestures
			const ancestors = buildAncestorChain([
				{ gestureEnabled: false, isIsolated: true, panGesture: null },
				{ gestureEnabled: true, isIsolated: true, panGesture: "isolated-pan" },
				{ gestureEnabled: true, isIsolated: false, panGesture: "outer-pan" },
			]);

			const result = collectAncestorPanGestures(ancestors, true);

			expect(result).toEqual(["isolated-pan"]);
		});
	});

	describe("mixed scenarios", () => {
		it("non-isolated screen can propagate through isolated ancestors to non-isolated ones", () => {
			// Edge case: non-isolated screen nested inside isolated, then non-isolated
			// This tests that non-isolated screens don't care about isolation boundaries
			const ancestors = buildAncestorChain([
				{ gestureEnabled: true, isIsolated: true, panGesture: "isolated-pan" },
				{ gestureEnabled: true, isIsolated: false, panGesture: "outer-pan" },
			]);

			const result = collectAncestorPanGestures(ancestors, false);

			// Non-isolated screens propagate to ALL ancestors regardless of their isolation status
			expect(result).toEqual(["isolated-pan", "outer-pan"]);
		});

		it("handles real-world scenario: scrollview in component stack", () => {
			// Real scenario from the bug:
			// SessionId (non-isolated, vertical dismiss)
			//   -> ScreenA (non-isolated, contains component stack)
			//     -> ComponentStack ScreenInsideComponent (isolated, scrollview, gestureEnabled: false)
			//
			// The scrollview screen should NOT collect SessionId's gestures
			const ancestors = buildAncestorChain([
				// ScreenA - the screen containing the component stack (non-isolated)
				{ gestureEnabled: false, isIsolated: false, panGesture: null },
				// SessionId navigator's gesture context (non-isolated, has vertical dismiss)
				{ gestureEnabled: true, isIsolated: false, panGesture: "sessionId-vertical-pan" },
			]);

			// Current screen is in a component stack (isolated)
			const result = collectAncestorPanGestures(ancestors, true);

			// Should stop immediately at ScreenA (non-isolated boundary)
			// and NOT collect sessionId's pan gesture
			expect(result).toEqual([]);
		});

		it("handles real-world scenario: scrollview in nested non-isolated navigators", () => {
			// Real scenario that SHOULD propagate:
			// SessionId (non-isolated, vertical dismiss)
			//   -> ScreenA (non-isolated)
			//     -> ScreenB (non-isolated, horizontal dismiss)
			//       -> ScreenC (non-isolated, scrollview, gestureEnabled: false)
			//
			// The scrollview should collect BOTH ScreenB and SessionId gestures
			const ancestors = buildAncestorChain([
				{ gestureEnabled: true, isIsolated: false, panGesture: "screenB-horizontal-pan" },
				{ gestureEnabled: false, isIsolated: false, panGesture: null },
				{ gestureEnabled: true, isIsolated: false, panGesture: "sessionId-vertical-pan" },
			]);

			const result = collectAncestorPanGestures(ancestors, false);

			expect(result).toEqual([
				"screenB-horizontal-pan",
				"sessionId-vertical-pan",
			]);
		});

		it("handles component stack with snap points", () => {
			// Scenario:
			// SessionId (non-isolated, vertical)
			//   -> ScreenA (non-isolated)
			//     -> ComponentStack with snap points (isolated, gestureEnabled: true due to snap points)
			//       -> ScrollView screen inside component (isolated, gestureEnabled: false)
			//
			// ScrollView should collect ComponentStack's snap gesture but NOT SessionId's
			const ancestors = buildAncestorChain([
				// ComponentStack's gesture context (isolated, has snap point gestures)
				{ gestureEnabled: true, isIsolated: true, panGesture: "component-snap-pan" },
				// ScreenA (non-isolated)
				{ gestureEnabled: false, isIsolated: false, panGesture: null },
				// SessionId (non-isolated)
				{ gestureEnabled: true, isIsolated: false, panGesture: "sessionId-pan" },
			]);

			const result = collectAncestorPanGestures(ancestors, true);

			// Should collect component stack's snap gesture and stop at isolation boundary
			expect(result).toEqual(["component-snap-pan"]);
		});
	});
});
