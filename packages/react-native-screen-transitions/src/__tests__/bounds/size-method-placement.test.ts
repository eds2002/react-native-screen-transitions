import { describe, expect, it } from "bun:test";
import { applyBoundsScreenFrames } from "../../utils/bounds/helpers/styles/apply-screen-frames";
import { attachBoundsScreenFrame } from "../../utils/bounds/helpers/styles/screen-frame";
import type { ScreenTransform } from "../../utils/bounds/types/geometry";

const W = 400;
const H = 800;

type Rect = { x: number; y: number; width: number; height: number };

/** Where a box laid out at `layout` is drawn by a transform list of translates and scales (about its center). */
const drawn = (layout: Rect, transform: Record<string, number>[]): Rect => {
	let sx = 1;
	let sy = 1;
	let tx = 0;
	let ty = 0;
	// Items apply right to left to a point: p -> T1 (T2 (... p)). Fold from the right.
	for (let i = transform.length - 1; i >= 0; i--) {
		const [key, value] = Object.entries(transform[i])[0];
		if (key === "translateX") tx += value;
		else if (key === "translateY") ty += value;
		else if (key === "scaleX") {
			sx *= value;
			tx *= value;
		} else if (key === "scaleY") {
			sy *= value;
			ty *= value;
		} else throw new Error(`unexpected ${key}`);
	}
	const cx = layout.x + layout.width / 2;
	const cy = layout.y + layout.height / 2;
	return {
		x: cx + tx - (layout.width * sx) / 2,
		y: cy + ty - (layout.height * sy) / 2,
		width: layout.width * sx,
		height: layout.height * sy,
	};
};

/** One element mid-flight between two screens drawn at different scales (overlapping transitions). */
const place = (style: Record<string, unknown>) => {
	const layout = { pageX: 20, pageY: 300, width: 360, height: 130, x: 20, y: 300 };
	const framed = attachBoundsScreenFrame(style, {
		tag: "card",
		t: 0.5,
		sourceScreenKey: "A",
		destinationScreenKey: "B",
		screenKey: "B",
		layout,
		start: { ...layout, pageX: 250, pageY: 600, width: 110, height: 140 },
		end: layout,
		startChain: [],
	});
	const transforms: Record<string, ScreenTransform> = {
		A: { sx: 1, sy: 1, tx: 0, ty: 0, width: W, height: H },
		B: { sx: 0.5, sy: 0.5, tx: 100, ty: 200, width: W, height: H },
	};
	const out = applyBoundsScreenFrames({ card: { style: framed } } as never, transforms) as unknown as Record<
		string,
		{ style: { width?: number; height?: number; transform: Record<string, number>[] } }
	>;
	return { layout: { x: 20, y: 300, width: 360, height: 130 }, style: out.card.style };
};

describe("size method under a scaling correction", () => {
	it("resizes the box instead of scaling it, and draws it where the scale would", () => {
		const own = [{ translateX: 12 }, { translateY: -30 }];
		const scaled = place({ transform: own });
		const sized = place({ width: 360, height: 130, transform: own });

		// The transform method is corrected with a scale.
		expect(scaled.style.transform.some((item) => "scaleX" in item)).toBe(true);
		// The size method never scales: its box changes size, its content is laid out at that size.
		expect(sized.style.transform.some((item) => "scaleX" in item || "scaleY" in item)).toBe(false);
		expect(sized.style.width).not.toBeCloseTo(360, 3);

		const want = drawn(scaled.layout, scaled.style.transform);
		const got = drawn(
			{ ...sized.layout, width: sized.style.width as number, height: sized.style.height as number },
			sized.style.transform,
		);
		expect(got.x).toBeCloseTo(want.x, 4);
		expect(got.y).toBeCloseTo(want.y, 4);
		expect(got.width).toBeCloseTo(want.width, 4);
		expect(got.height).toBeCloseTo(want.height, 4);
	});
});
