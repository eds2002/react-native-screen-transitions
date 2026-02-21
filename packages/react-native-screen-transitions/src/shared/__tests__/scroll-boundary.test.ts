import { describe, expect, it } from "bun:test";
import type { ScrollConfig } from "../providers/gestures.provider";
import { checkScrollBoundary } from "../hooks/gestures/use-build-gestures/helpers/check-gesture-activation";

/**
 * Tests for ScrollView boundary detection.
 *
 * Per the spec:
 * - ScrollView must be at boundary before yielding to gestures
 * - A vertical ScrollView never yields to horizontal gestures (axis isolation)
 * - Boundary conditions differ by direction and sheet type
 */

/** Helper to create ScrollConfig with sensible defaults */
function createScrollConfig(overrides: Partial<ScrollConfig> = {}): ScrollConfig {
	return {
		x: 0,
		y: 0,
		contentWidth: 375,
		contentHeight: 1000,
		layoutWidth: 375,
		layoutHeight: 500,
		isTouched: true,
		...overrides,
	};
}

describe("checkScrollBoundary", () => {
	describe("null scrollConfig (no ScrollView)", () => {
		it("returns true for all directions when no ScrollView", () => {
			expect(checkScrollBoundary(null, "vertical")).toBe(true);
			expect(checkScrollBoundary(null, "vertical-inverted")).toBe(true);
			expect(checkScrollBoundary(null, "horizontal")).toBe(true);
			expect(checkScrollBoundary(null, "horizontal-inverted")).toBe(true);
		});
	});

	describe("Non-sheet screens (snapAxisInverted undefined)", () => {
		describe("vertical direction (swipe down)", () => {
			it("returns true when at scroll top (y=0)", () => {
				const config = createScrollConfig({ y: 0 });
				expect(checkScrollBoundary(config, "vertical")).toBe(true);
			});

			it("returns false when scrolled down", () => {
				const config = createScrollConfig({ y: 100 });
				expect(checkScrollBoundary(config, "vertical")).toBe(false);
			});

			it("returns true when content fits in viewport (not scrollable)", () => {
				const config = createScrollConfig({
					y: 0,
					contentHeight: 400, // Less than layout
					layoutHeight: 500,
				});
				expect(checkScrollBoundary(config, "vertical")).toBe(true);
			});
		});

		describe("vertical-inverted direction (swipe up)", () => {
			it("returns true when at scroll bottom", () => {
				// maxScrollY = contentHeight - layoutHeight = 1000 - 500 = 500
				const config = createScrollConfig({ y: 500 });
				expect(checkScrollBoundary(config, "vertical-inverted")).toBe(true);
			});

			it("returns false when not at bottom", () => {
				const config = createScrollConfig({ y: 200 });
				expect(checkScrollBoundary(config, "vertical-inverted")).toBe(false);
			});

			it("returns true when content fits in viewport (not scrollable)", () => {
				const config = createScrollConfig({
					y: 0,
					contentHeight: 400,
					layoutHeight: 500,
				});
				expect(checkScrollBoundary(config, "vertical-inverted")).toBe(true);
			});
		});

		describe("horizontal direction (swipe right)", () => {
			it("returns true when at scroll left (x=0)", () => {
				const config = createScrollConfig({
					x: 0,
					contentWidth: 1000,
					layoutWidth: 375,
				});
				expect(checkScrollBoundary(config, "horizontal")).toBe(true);
			});

			it("returns false when scrolled right", () => {
				const config = createScrollConfig({
					x: 100,
					contentWidth: 1000,
					layoutWidth: 375,
				});
				expect(checkScrollBoundary(config, "horizontal")).toBe(false);
			});

			it("returns true when content fits in viewport (not scrollable)", () => {
				const config = createScrollConfig({
					x: 0,
					contentWidth: 300,
					layoutWidth: 375,
				});
				expect(checkScrollBoundary(config, "horizontal")).toBe(true);
			});
		});

		describe("horizontal-inverted direction (swipe left)", () => {
			it("returns true when at scroll right edge", () => {
				// maxScrollX = contentWidth - layoutWidth = 1000 - 375 = 625
				const config = createScrollConfig({
					x: 625,
					contentWidth: 1000,
					layoutWidth: 375,
				});
				expect(checkScrollBoundary(config, "horizontal-inverted")).toBe(true);
			});

			it("returns false when not at right edge", () => {
				const config = createScrollConfig({
					x: 200,
					contentWidth: 1000,
					layoutWidth: 375,
				});
				expect(checkScrollBoundary(config, "horizontal-inverted")).toBe(false);
			});
		});
	});

	describe("Snap point sheets (snapAxisInverted defined)", () => {
		describe("Bottom sheet (vertical, not inverted)", () => {
			/**
			 * Bottom sheet: originates from bottom, boundary at scrollY = 0 (top)
			 */
			it("returns true when at scroll top for both vertical directions", () => {
				const config = createScrollConfig({ y: 0 });

				// Both collapse (vertical) and expand (vertical-inverted) check same boundary
				expect(checkScrollBoundary(config, "vertical", false)).toBe(true);
				expect(checkScrollBoundary(config, "vertical-inverted", false)).toBe(
					true,
				);
			});

			it("returns false when scrolled down for both directions", () => {
				const config = createScrollConfig({ y: 100 });

				expect(checkScrollBoundary(config, "vertical", false)).toBe(false);
				expect(checkScrollBoundary(config, "vertical-inverted", false)).toBe(
					false,
				);
			});
		});

		describe("Top sheet (vertical-inverted, inverted)", () => {
			/**
			 * Top sheet: originates from top, boundary at scrollY = maxY (bottom)
			 */
			it("returns true when at scroll bottom for both vertical directions", () => {
				// maxScrollY = 1000 - 500 = 500
				const config = createScrollConfig({ y: 500 });

				expect(checkScrollBoundary(config, "vertical", true)).toBe(true);
				expect(checkScrollBoundary(config, "vertical-inverted", true)).toBe(
					true,
				);
			});

			it("returns false when not at bottom for both directions", () => {
				const config = createScrollConfig({ y: 200 });

				expect(checkScrollBoundary(config, "vertical", true)).toBe(false);
				expect(checkScrollBoundary(config, "vertical-inverted", true)).toBe(
					false,
				);
			});
		});

		describe("Right drawer (horizontal, not inverted)", () => {
			/**
			 * Right drawer: originates from right, boundary at scrollX = 0 (left)
			 */
			it("returns true when at scroll left for both horizontal directions", () => {
				const config = createScrollConfig({
					x: 0,
					contentWidth: 1000,
					layoutWidth: 375,
				});

				expect(checkScrollBoundary(config, "horizontal", false)).toBe(true);
				expect(checkScrollBoundary(config, "horizontal-inverted", false)).toBe(
					true,
				);
			});

			it("returns false when scrolled right for both directions", () => {
				const config = createScrollConfig({
					x: 100,
					contentWidth: 1000,
					layoutWidth: 375,
				});

				expect(checkScrollBoundary(config, "horizontal", false)).toBe(false);
				expect(checkScrollBoundary(config, "horizontal-inverted", false)).toBe(
					false,
				);
			});
		});

		describe("Left drawer (horizontal-inverted, inverted)", () => {
			/**
			 * Left drawer: originates from left, boundary at scrollX = maxX (right)
			 */
			it("returns true when at scroll right for both horizontal directions", () => {
				// maxScrollX = 1000 - 375 = 625
				const config = createScrollConfig({
					x: 625,
					contentWidth: 1000,
					layoutWidth: 375,
				});

				expect(checkScrollBoundary(config, "horizontal", true)).toBe(true);
				expect(checkScrollBoundary(config, "horizontal-inverted", true)).toBe(
					true,
				);
			});

			it("returns false when not at right for both directions", () => {
				const config = createScrollConfig({
					x: 200,
					contentWidth: 1000,
					layoutWidth: 375,
				});

				expect(checkScrollBoundary(config, "horizontal", true)).toBe(false);
				expect(checkScrollBoundary(config, "horizontal-inverted", true)).toBe(
					false,
				);
			});
		});

		describe("Non-scrollable content in sheets", () => {
			it("returns true when vertical content fits in viewport", () => {
				const config = createScrollConfig({
					contentHeight: 400,
					layoutHeight: 500,
				});

				// Both inverted and non-inverted should pass
				expect(checkScrollBoundary(config, "vertical", false)).toBe(true);
				expect(checkScrollBoundary(config, "vertical", true)).toBe(true);
			});

			it("returns true when horizontal content fits in viewport", () => {
				const config = createScrollConfig({
					contentWidth: 300,
					layoutWidth: 375,
				});

				expect(checkScrollBoundary(config, "horizontal", false)).toBe(true);
				expect(checkScrollBoundary(config, "horizontal", true)).toBe(true);
			});
		});
	});

	describe("Axis isolation", () => {
		/**
		 * Per spec: A vertical ScrollView never yields to horizontal gestures.
		 * This is handled by the non-scrollable check - if horizontal content
		 * doesn't exceed viewport, horizontal gestures pass through.
		 */
		it("vertical scroll does not block horizontal gestures", () => {
			// Vertical scrollable (contentHeight > layoutHeight)
			// Horizontal NOT scrollable (contentWidth <= layoutWidth)
			const config = createScrollConfig({
				x: 0,
				y: 100, // Scrolled down
				contentHeight: 1000,
				layoutHeight: 500,
				contentWidth: 375,
				layoutWidth: 375,
			});

			// Vertical should be blocked (not at boundary)
			expect(checkScrollBoundary(config, "vertical")).toBe(false);

			// Horizontal should pass (not scrollable horizontally)
			expect(checkScrollBoundary(config, "horizontal")).toBe(true);
			expect(checkScrollBoundary(config, "horizontal-inverted")).toBe(true);
		});

		it("horizontal scroll does not block vertical gestures", () => {
			// Horizontal scrollable
			// Vertical NOT scrollable
			const config = createScrollConfig({
				x: 100, // Scrolled right
				y: 0,
				contentHeight: 400,
				layoutHeight: 500,
				contentWidth: 1000,
				layoutWidth: 375,
			});

			// Horizontal should be blocked (not at boundary)
			expect(checkScrollBoundary(config, "horizontal")).toBe(false);

			// Vertical should pass (not scrollable vertically)
			expect(checkScrollBoundary(config, "vertical")).toBe(true);
			expect(checkScrollBoundary(config, "vertical-inverted")).toBe(true);
		});
	});
});
