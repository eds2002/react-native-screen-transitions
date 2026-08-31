import type { SmoothClipPresentation } from "react-native-smooth-clip-view";
import {
	type LegacyClipProjectionResult,
	resolveLegacyClipProjection,
	updateLegacyClipFootprint,
} from "../../providers/screen/clip/legacy-clip-projector";

const FOOTPRINT = { height: 200, width: 300 } as const;

const expectClip = (result: LegacyClipProjectionResult) => {
	expect(result.kind).toBe("clip");
	if (result.kind !== "clip") throw new Error("Expected a clip projection");
	return result.presentation;
};

describe("resolveLegacyClipProjection", () => {
	test("keeps measurement unclipped until the first valid footprint and latches it", () => {
		const initial = updateLegacyClipFootprint(null, 0, Number.NaN);
		expect(initial).toBeNull();
		const measured = updateLegacyClipFootprint(initial, 320, 640);
		expect(measured).toEqual({ height: 640, width: 320 });
		expect(updateLegacyClipFootprint(measured, 0, 0)).toBe(measured);
		expect(updateLegacyClipFootprint(measured, 320, 640)).toBe(measured);
		expect(updateLegacyClipFootprint(measured, 640, 320)).toEqual({
			height: 320,
			width: 640,
		});
	});

	test("projects an omitted style to the full fixed footprint", () => {
		const presentation = expectClip(
			resolveLegacyClipProjection({ footprint: FOOTPRINT }),
		);

		expect(presentation).toEqual({
			clip: {
				bottomLeftRadius: 0,
				bottomRightRadius: 0,
				curve: "circular",
				height: 200,
				radius: 0,
				topLeftRadius: 0,
				topRightRadius: 0,
				width: 300,
				x: 0,
				y: 0,
			},
			contentScale: 1,
			contentTranslateX: 0,
			contentTranslateY: 0,
		});
	});

	test("resolves numeric and percentage dimensions and positioned edges", () => {
		const presentation = expectClip(
			resolveLegacyClipProjection({
				footprint: FOOTPRINT,
				style: {
					bottom: "10%",
					height: "50%",
					right: 30,
					width: "40%",
				},
			}),
		);

		expect(presentation.clip).toMatchObject({
			height: 100,
			width: 120,
			x: 150,
			y: 80,
		});
	});

	test("stretches an omitted dimension between two edges", () => {
		const presentation = expectClip(
			resolveLegacyClipProjection({
				footprint: FOOTPRINT,
				style: { bottom: 40, left: "10%", right: 20, top: 10 },
			}),
		);

		expect(presentation.clip).toMatchObject({
			height: 150,
			width: 250,
			x: 30,
			y: 10,
		});
	});

	test.each([
		[{ left: 1, right: 2, width: 3 }, "ambiguous-horizontal-layout"],
		[{ left: 1 }, "ambiguous-horizontal-layout"],
		[{ bottom: 1, height: 2, top: 3 }, "ambiguous-vertical-layout"],
		[{ bottom: 1 }, "ambiguous-vertical-layout"],
	] as const)("rejects ambiguous axis constraints %#", (style, reason) => {
		expect(resolveLegacyClipProjection({ footprint: FOOTPRINT, style })).toMatchObject(
			{ kind: "fallback", reason },
		);
	});

	test.each([
		{ width: "auto" },
		{ height: Number.NaN },
		{ left: "calc(10%)", width: 100 },
		{ left: 200, right: 200 },
		{ height: -1 },
	] as const)("rejects invalid layout values %#", (style) => {
		expect(resolveLegacyClipProjection({ footprint: FOOTPRINT, style })).toMatchObject(
			{ kind: "fallback", reason: "invalid-layout-value" },
		);
	});

	test("applies transform operations in React Native list order", () => {
		const translatedThenScaled = expectClip(
			resolveLegacyClipProjection({
				footprint: FOOTPRINT,
				style: {
					height: 40,
					transform: [{ translateX: 10 }, { scale: 2 }],
					transformOrigin: [0, 0],
					width: 100,
				},
			}),
		);
		const scaledThenTranslated = expectClip(
			resolveLegacyClipProjection({
				footprint: FOOTPRINT,
				style: {
					height: 40,
					transform: [{ scale: 2 }, { translateX: 10 }],
					transformOrigin: [0, 0],
					width: 100,
				},
			}),
		);

		expect(translatedThenScaled.clip).toMatchObject({ width: 200, x: 10 });
		expect(scaledThenTranslated.clip).toMatchObject({ width: 200, x: 20 });
	});

	test("supports percentage and combined translations", () => {
		const presentation = expectClip(
			resolveLegacyClipProjection({
				footprint: FOOTPRINT,
				style: {
					height: 80,
					transform: [
						{ translateX: "50%" },
						{ translate: [10, "25%", 0] },
					],
					width: 100,
				},
			}),
		);

		expect(presentation.clip).toMatchObject({ x: 60, y: 20 });
	});

	test("uses the center transform origin by default and accepts custom origins", () => {
		const centered = expectClip(
			resolveLegacyClipProjection({
				footprint: FOOTPRINT,
				style: { height: 40, transform: [{ scale: 2 }], width: 100 },
			}),
		);
		const bottomRight = expectClip(
			resolveLegacyClipProjection({
				footprint: FOOTPRINT,
				style: {
					height: 40,
					transform: [{ scale: 2 }],
					transformOrigin: "right bottom",
					width: 100,
				},
			}),
		);
		const keywordOrder = expectClip(
			resolveLegacyClipProjection({
				footprint: FOOTPRINT,
				style: {
					height: 40,
					transform: [{ scale: 2 }],
					transformOrigin: "top left",
					width: 100,
				},
			}),
		);

		expect(centered.clip).toMatchObject({ height: 80, width: 200, x: -50, y: -20 });
		expect(bottomRight.clip).toMatchObject({ height: 80, width: 200, x: -100, y: -40 });
		expect(keywordOrder.clip).toMatchObject({ x: 0, y: 0 });
	});

	test.each([
		["left", { x: 0, y: -20 }],
		["top", { x: -50, y: 0 }],
		["center", { x: -50, y: -20 }],
		["25%", { x: -25, y: -20 }],
		["0", { x: 0, y: -20 }],
	] as const)(
		"matches React Native's omitted-axis transformOrigin default for %s",
		(transformOrigin, expected) => {
			const presentation = expectClip(
				resolveLegacyClipProjection({
					footprint: FOOTPRINT,
					style: {
						height: 40,
						transform: [{ scale: 2 }],
						transformOrigin,
						width: 100,
					},
				}),
			);

			expect(presentation.clip).toMatchObject(expected);
		},
	);

	test("accepts React Native's string z origin when only 2D transforms are used", () => {
		const presentation = expectClip(
			resolveLegacyClipProjection({
				footprint: FOOTPRINT,
				style: {
					height: 40,
					transform: [{ scale: 2 }],
					transformOrigin: "right bottom 15px",
					width: 100,
				},
			}),
		);

		expect(presentation.clip).toMatchObject({ x: -100, y: -40 });
	});

	test("accepts separate scale axes only when their final scale is uniform", () => {
		const presentation = expectClip(
			resolveLegacyClipProjection({
				footprint: FOOTPRINT,
				style: {
					height: 40,
					transform: [{ scaleX: 2 }, { scaleY: 2 }],
					width: 100,
				},
			}),
		);
		expect(presentation.clip).toMatchObject({ height: 80, width: 200 });
		expect(
			resolveLegacyClipProjection({
				footprint: FOOTPRINT,
				style: { transform: [{ scaleX: 2 }] },
			}),
		).toMatchObject({ kind: "fallback", reason: "non-uniform-scale" });
	});

	test.each([0, -1])(
		"rejects a non-positive scale (%s)",
		(scale) => {
			expect(
				resolveLegacyClipProjection({
					footprint: FOOTPRINT,
					style: { transform: [{ scale }] },
				}),
			).toMatchObject({ kind: "fallback", reason: "non-positive-scale" });
		},
	);

	test("rejects a non-finite scale as an invalid transform", () => {
		expect(
			resolveLegacyClipProjection({
				footprint: FOOTPRINT,
				style: { transform: [{ scale: Number.NEGATIVE_INFINITY }] },
			}),
		).toMatchObject({ kind: "fallback", reason: "invalid-transform" });
	});

	test.each([
		["rotate", "30deg"],
		["rotateX", "0rad"],
		["rotateY", "0rad"],
		["rotateZ", "0rad"],
		["skewX", "10deg"],
		["skewY", "10deg"],
		["perspective", 500],
		["matrix", [1, 0, 0, 1, 0, 0]],
	] as const)("rejects unsupported %s transforms", (property, operand) => {
		expect(
			resolveLegacyClipProjection({
				footprint: FOOTPRINT,
				style: { transform: [{ [property]: operand }] },
			}),
		).toMatchObject({
			detail: property,
			kind: "fallback",
			reason: "unsupported-transform",
		});
	});

	test.each([
		["borderWidth", 1, "unsupported-border"],
		["borderColor", "red", "unsupported-border"],
		["borderStartStartRadius", 8, "unsupported-border"],
		["shadowOpacity", 0.5, "unsupported-shadow"],
		["boxShadow", "0 0 2px black", "unsupported-shadow"],
		["elevation", 2, "unsupported-shadow"],
		["aspectRatio", 1, "unsupported-layout"],
		["marginLeft", 10, "unsupported-layout"],
		["start", 0, "unsupported-layout"],
	] as const)("atomically rejects unsupported %s", (property, value, reason) => {
		expect(
			resolveLegacyClipProjection({
				footprint: FOOTPRINT,
				style: { height: 20, width: 20, [property]: value },
			}),
		).toMatchObject({ detail: property, kind: "fallback", reason });
	});

	test("projects shorthand and per-corner radii with continuous curves", () => {
		const presentation = expectClip(
			resolveLegacyClipProjection({
				footprint: FOOTPRINT,
				style: {
					borderBottomRightRadius: 20,
					borderContinuous: true,
					borderRadius: 10,
					borderTopLeftRadius: 5,
					height: 80,
					transform: [{ scale: 2 }],
					width: 100,
				},
			}),
		);

		expect(presentation.clip).toMatchObject({
			bottomLeftRadius: 20,
			bottomRightRadius: 40,
			curve: "continuous",
			radius: 0,
			topLeftRadius: 10,
			topRightRadius: 20,
		});
	});

	test("normalizes overlapping corner radii proportionally", () => {
		const presentation = expectClip(
			resolveLegacyClipProjection({
				footprint: FOOTPRINT,
				style: {
					borderBottomLeftRadius: 40,
					borderBottomRightRadius: 20,
					borderTopLeftRadius: 80,
					borderTopRightRadius: 40,
					height: 60,
					width: 60,
				},
			}),
		);

		expect(presentation.clip).toMatchObject({
			bottomLeftRadius: 20,
			bottomRightRadius: 10,
			topLeftRadius: 40,
			topRightRadius: 20,
		});
	});

	test.each([
		[{ opacity: 0.5 }, "alpha-mask"],
		[{ opacity: Number.NaN }, "alpha-mask"],
		[{ backgroundColor: "transparent" }, "background-alpha-mask"],
		[{ backgroundColor: "#ffffff80" }, "background-alpha-mask"],
		[{ backgroundColor: "rgba(255, 255, 255, 50%)" }, "background-alpha-mask"],
		[{ backgroundColor: "rgb(255 255 255 / 0.5)" }, "background-alpha-mask"],
		[{ backgroundColor: { dynamic: true } }, "background-alpha-mask"],
	] as const)("marks alpha semantics as intentionally unclipped %#", (style, reason) => {
		expect(resolveLegacyClipProjection({ footprint: FOOTPRINT, style })).toMatchObject(
			{ kind: "unclipped", reason },
		);
	});

	test.each(["white", "#fff", "#ffffffff", "rgb(255,255,255)"])(
		"accepts opaque background color %s",
		(backgroundColor) => {
			expect(
				resolveLegacyClipProjection({
					footprint: FOOTPRINT,
					style: { backgroundColor },
				}),
			).toMatchObject({ kind: "clip", source: "legacy" });
		},
	);

	test("gives an explicit clip precedence over every legacy failure", () => {
		const clip: SmoothClipPresentation = {
			clip: { height: 40, radius: 4, width: 30, x: 1, y: 2 },
			contentScale: 1,
			contentTranslateX: 3,
			contentTranslateY: 4,
		};
		const result = resolveLegacyClipProjection({
			clip,
			footprint: { height: 0, width: 0 },
			style: {
				opacity: 0,
				shadowOpacity: 1,
				transform: [{ rotate: "45deg" }],
			},
		});

		expect(result).toMatchObject({ kind: "clip", source: "explicit" });
		expect(expectClip(result)).toMatchObject({
			contentTranslateX: 3,
			contentTranslateY: 4,
		});
	});

	test("treats the internal null channel as an explicit restore-base marker", () => {
		expect(
			resolveLegacyClipProjection({
				clip: null,
				footprint: FOOTPRINT,
				style: { width: 20 },
			}),
		).toEqual({ kind: "reset" });
	});

	test("rejects an invalid explicit clip without falling through to legacy style", () => {
		expect(
			resolveLegacyClipProjection({
				clip: {
					clip: { height: 10, radius: 0, width: Number.NaN, x: 0, y: 0 },
					contentTranslateX: 0,
					contentTranslateY: 0,
				},
				footprint: FOOTPRINT,
				style: {},
			}),
		).toMatchObject({ kind: "fallback", reason: "invalid-explicit-clip" });
	});

	test.each([
		{ height: 0, width: 100 },
		{ height: 100, width: Number.NaN },
		{ height: Number.POSITIVE_INFINITY, width: 100 },
	] as const)("rejects an invalid fixed footprint %#", (footprint) => {
		expect(resolveLegacyClipProjection({ footprint })).toMatchObject({
			kind: "fallback",
			reason: "invalid-footprint",
		});
	});
});
