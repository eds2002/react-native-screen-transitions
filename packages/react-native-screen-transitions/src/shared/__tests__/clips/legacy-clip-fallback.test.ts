import {
	INITIAL_LEGACY_CLIP_RENDER_STATE,
	type LegacyClipRenderState,
	resolveLegacyClipRenderState,
	resolveLegacyOverflowCarrierStyle,
	selectLegacySmoothClipPresentation,
} from "../../providers/screen/clip/legacy-clip-fallback";
import type { LegacyClipProjectionResult } from "../../providers/screen/clip/legacy-clip-projector";

const LEGACY_CLIP = {
	kind: "clip",
	presentation: {
		clip: {
			bottomLeftRadius: 0,
			bottomRightRadius: 0,
			curve: "circular",
			height: 100,
			radius: 0,
			topLeftRadius: 0,
			topRightRadius: 0,
			width: 100,
			x: 0,
			y: 0,
		},
		contentScale: 1,
		contentTranslateX: 0,
		contentTranslateY: 0,
	},
	source: "legacy",
} as const satisfies LegacyClipProjectionResult;

const EXPLICIT_CLIP = {
	...LEGACY_CLIP,
	source: "explicit",
} as const satisfies LegacyClipProjectionResult;

const nextState = (
	current: LegacyClipRenderState,
	projection: LegacyClipProjectionResult,
	slotPresent = true,
) => resolveLegacyClipRenderState({ current, projection, slotPresent });

const OVERFLOW_STATE = {
	mode: "overflow",
	overflowLatched: true,
} as const satisfies LegacyClipRenderState;

describe("legacy clip fallback mode", () => {
	test.each([
		"unsupported-transform",
		"non-positive-scale",
		"non-uniform-scale",
		"unsupported-border",
		"unsupported-shadow",
		"ambiguous-horizontal-layout",
	] as const)("enters RN overflow for %s", (reason) => {
		expect(
			nextState(INITIAL_LEGACY_CLIP_RENDER_STATE, {
				kind: "fallback",
				reason,
			}),
		).toEqual(OVERFLOW_STATE);
	});

	test("latches overflow across later supported frames", () => {
		expect(nextState(OVERFLOW_STATE, LEGACY_CLIP)).toEqual(OVERFLOW_STATE);
	});

	test("renders alpha frames unclipped without clearing an overflow latch", () => {
		expect(
			nextState(OVERFLOW_STATE, {
				kind: "unclipped",
				reason: "alpha-mask",
			}),
		).toEqual({ mode: "unclipped", overflowLatched: true });
		expect(
			nextState(
				{ mode: "unclipped", overflowLatched: true },
				LEGACY_CLIP,
			),
		).toEqual(OVERFLOW_STATE);
	});

	test("keeps alpha-only participants unclipped without latching overflow", () => {
		expect(
			nextState(INITIAL_LEGACY_CLIP_RENDER_STATE, {
				kind: "unclipped",
				reason: "background-alpha-mask",
			}),
		).toEqual({ mode: "unclipped", overflowLatched: false });
		expect(
			nextState(
				{ mode: "unclipped", overflowLatched: false },
				LEGACY_CLIP,
			),
		).toEqual(INITIAL_LEGACY_CLIP_RENDER_STATE);
	});

	test("clears the latch only at a boundary reset or valid explicit clip", () => {
		expect(nextState(OVERFLOW_STATE, LEGACY_CLIP, false)).toEqual(
			INITIAL_LEGACY_CLIP_RENDER_STATE,
		);
		expect(nextState(OVERFLOW_STATE, { kind: "reset" })).toEqual(
			INITIAL_LEGACY_CLIP_RENDER_STATE,
		);
		expect(nextState(OVERFLOW_STATE, EXPLICIT_CLIP)).toEqual(
			INITIAL_LEGACY_CLIP_RENDER_STATE,
		);
		expect(
			nextState(OVERFLOW_STATE, {
				kind: "fallback",
				reason: "invalid-explicit-clip",
			}),
		).toBe(OVERFLOW_STATE);
	});

	test("restores SmoothClip to base whenever overflow or alpha owns rendering", () => {
		const base = { ...LEGACY_CLIP.presentation, contentTranslateX: 99 };
		expect(
			selectLegacySmoothClipPresentation(base, LEGACY_CLIP, OVERFLOW_STATE),
		).toBe(base);
		expect(
			selectLegacySmoothClipPresentation(
				base,
				{ kind: "unclipped", reason: "alpha-mask" },
				{ mode: "unclipped", overflowLatched: false },
			),
		).toBe(base);
		expect(
			selectLegacySmoothClipPresentation(
				base,
				LEGACY_CLIP,
				INITIAL_LEGACY_CLIP_RENDER_STATE,
			),
		).toBe(LEGACY_CLIP.presentation);
	});
});

describe("legacy RN overflow carrier style", () => {
	test("atomically preserves the original style and transform order", () => {
		const transform = [
			{ translateX: 12 },
			{ rotateZ: "25deg" },
			{ skewX: "5deg" },
		] as const;
		const style = {
			borderRadius: 18,
			left: "10%",
			shadowOpacity: 0.4,
			transform,
			transformOrigin: [4, 7],
			width: 120,
		};

		const resolved = resolveLegacyOverflowCarrierStyle("overflow", style);

		expect(resolved).toEqual({
			...style,
			display: "flex",
			overflow: "hidden",
		});
		expect(resolved.transform).toBe(transform);
	});

	test("forces clipping but preserves an explicit display mode", () => {
		expect(
			resolveLegacyOverflowCarrierStyle("overflow", {
				display: "none",
				overflow: "visible",
			}),
		).toEqual({ display: "none", overflow: "hidden" });
	});

	test.each(["smooth", "unclipped"] as const)(
		"removes the RN carrier box in %s mode",
		(mode) => {
			expect(
				resolveLegacyOverflowCarrierStyle(mode, {
					transform: [{ rotate: "45deg" }],
				}),
			).toEqual({ display: "contents" });
		},
	);
});
