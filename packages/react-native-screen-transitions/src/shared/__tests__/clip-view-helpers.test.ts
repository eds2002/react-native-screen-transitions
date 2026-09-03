import { describe, expect, it } from "bun:test";
import {
	assertValidMaximumSize,
	createDefaultClipPresentation,
	resolveClipHostFootprintStyle,
	resolveClipHostStyle,
	resolveClipVisualCarrierStyle,
	resolveScreenContentCarrierStyle,
} from "../components/clip-view/helpers";
import {
	createPositiveMaximumSizeFallback,
	selectFixedShellMaximumSize,
	updateDurableMaximumSize,
} from "../components/screen-container/hooks/use-fixed-shell-maximum-size";

describe("Transition.ClipView helpers", () => {
	it("creates the full maximum rectangle as the canonical default intent", () => {
		expect(
			createDefaultClipPresentation({ width: 320, height: 480 }),
		).toEqual({
			clip: {
				x: 0,
				y: 0,
				width: 320,
				height: 480,
				radius: 0,
				curve: "circular",
			},
			contentTranslateX: 0,
			contentTranslateY: 0,
			contentScale: 1,
		});
	});

	it("rejects non-finite and non-positive maximum dimensions", () => {
		expect(() =>
			assertValidMaximumSize({ width: Number.NaN, height: 100 }),
		).toThrow();
		expect(() =>
			assertValidMaximumSize({ width: 100, height: 0 }),
		).toThrow();
		expect(() =>
			assertValidMaximumSize({ width: 100, height: 200 }),
		).not.toThrow();
	});

	it("keeps visual residuals while explicit clip owns geometry", () => {
		expect(
			resolveClipVisualCarrierStyle(
				{
					opacity: 0.8,
					shadowOpacity: 0.4,
					width: 100,
					height: 80,
					left: 12,
					overflow: "hidden",
					transform: [
						{ translateX: 30 },
						{ scale: 0.8 },
						{ rotate: "12deg" },
						{ scaleX: 0.9 },
					],
				},
				true,
			),
		).toEqual({
			opacity: 0.8,
			shadowOpacity: 0.4,
			transform: [{ rotate: "12deg" }, { scaleX: 0.9 }],
		});
	});

	it("only enforces the fixed footprint when no explicit clip is present", () => {
		expect(
			resolveClipVisualCarrierStyle(
				{
					width: 100,
					height: 80,
					left: 12,
					transform: [{ translateX: 30 }],
				},
				false,
			),
		).toEqual({ left: 12, transform: [{ translateX: 30 }] });
	});

	it("removes every host style that can override maximumSize", () => {
		expect(
			resolveClipHostStyle({
				width: 100,
				height: 80,
				minWidth: 200,
				minHeight: 160,
				maxWidth: 50,
				maxHeight: 40,
				aspectRatio: 2,
				flex: 1,
				flexBasis: 300,
				flexGrow: 1,
				flexShrink: 1,
				boxSizing: "content-box",
				backgroundColor: "red",
				opacity: 0.75,
			}),
		).toEqual({
			hasConflictingDimensions: true,
			resolvedHostStyle: { backgroundColor: "red", opacity: 0.75 },
		});
	});

	it("preserves the complete legacy screen-content style until clip takes ownership", () => {
		const legacyStyle = {
			width: 100,
			height: 80,
			left: 12,
			overflow: "hidden" as const,
			borderRadius: 16,
			transform: [{ translateX: 30 }, { scale: 0.8 }],
		};

		expect(resolveScreenContentCarrierStyle(legacyStyle, false)).toBe(
			legacyStyle,
		);
		expect(resolveScreenContentCarrierStyle(legacyStyle, true)).toEqual({
			borderRadius: 16,
			transform: [],
		});
	});

	it("retains the last positive Yoga shell measurement", () => {
		const first = updateDurableMaximumSize(null, 280, 640);
		expect(first).toEqual({ width: 280, height: 640 });
		expect(updateDurableMaximumSize(first, 0, 0)).toBe(first);
		expect(updateDurableMaximumSize(first, Number.NaN, 700)).toBe(first);
		expect(updateDurableMaximumSize(first, 280, 640)).toBe(first);
		expect(updateDurableMaximumSize(first, 640, 280)).toEqual({
			width: 640,
			height: 280,
		});
	});

	it("uses positive window fallbacks before the first Yoga measurement", () => {
		expect(createPositiveMaximumSizeFallback(320, 640)).toEqual({
			width: 320,
			height: 640,
		});
		expect(createPositiveMaximumSizeFallback(0, Number.NaN)).toEqual({
			width: 1,
			height: 1,
		});
	});

	it("lets internal clip hosts fill Yoga without applying stale maximum dimensions", () => {
		expect(
			resolveClipHostFootprintStyle({ width: 320, height: 640 }, "fixed"),
		).toEqual({ width: 320, height: 640 });
		expect(
			resolveClipHostFootprintStyle({ width: 320, height: 640 }, "fill"),
		).toEqual({ bottom: 0, left: 0, position: "absolute", right: 0, top: 0 });
	});

	it("rejects a durable shell measurement from a previous window epoch", () => {
		const portraitMeasurement = {
			epoch: "320:640",
			maximumSize: { width: 280, height: 600 },
		};
		const landscapeFallback = { width: 640, height: 320 };

		expect(
			selectFixedShellMaximumSize(
				portraitMeasurement,
				"640:320",
				landscapeFallback,
			),
		).toBe(landscapeFallback);
		expect(
			selectFixedShellMaximumSize(
				portraitMeasurement,
				"320:640",
				landscapeFallback,
			),
		).toBe(portraitMeasurement.maximumSize);
	});
});
