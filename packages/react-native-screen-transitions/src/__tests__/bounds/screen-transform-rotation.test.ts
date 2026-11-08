import { describe, expect, it } from "bun:test";
import {
	type Affine,
	boundingBox,
	compose,
	readScreenTransform,
	type ScreenTransform,
	toAffine,
	toLayoutSpace,
} from "../../utils/bounds/helpers/screen-transform";
import { applyBoundsScreenFrames } from "../../utils/bounds/helpers/styles/apply-screen-frames";
import { attachBoundsScreenFrame } from "../../utils/bounds/helpers/styles/screen-frame";

const W = 400;
const H = 800;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** A transform list (translate / rotate / skewX / scale items, about `center`) as an affine. */
const affineOf = (
	items: Record<string, number | string>[],
	center: { x: number; y: number },
): Affine => {
	let m: Affine = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
	for (const item of items) {
		const [key, raw] = Object.entries(item)[0];
		const angle = typeof raw === "string" ? Number.parseFloat(raw) : 0;
		let step: Affine = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
		if (key === "translateX") step = { ...step, tx: raw as number };
		if (key === "translateY") step = { ...step, ty: raw as number };
		if (key === "rotate")
			step = { a: Math.cos(angle), b: Math.sin(angle), c: -Math.sin(angle), d: Math.cos(angle), tx: 0, ty: 0 };
		if (key === "skewX") step = { ...step, c: Math.tan(angle) };
		if (key === "scaleX") step = { ...step, a: raw as number };
		if (key === "scaleY") step = { ...step, d: raw as number };
		m = compose(m, step);
	}
	// About the center: p -> c + M (p - c).
	return compose(
		{ a: 1, b: 0, c: 0, d: 1, tx: center.x, ty: center.y },
		compose(m, { a: 1, b: 0, c: 0, d: 1, tx: -center.x, ty: -center.y }),
	);
};

const apply = (m: Affine, x: number, y: number) => [
	m.a * x + m.c * y + m.tx,
	m.b * x + m.d * y + m.ty,
];

describe("screen transforms with rotation", () => {
	it("reads translate, rotate and scale in their order", () => {
		const t = readScreenTransform(
			{ transform: [{ translateX: 30 }, { translateY: -12 }, { rotate: "8deg" }, { scale: 0.85 }] },
			W,
			H,
		);
		expect(t.tx).toBeCloseTo(30);
		expect(t.ty).toBeCloseTo(-12);
		expect(t.rot).toBeCloseTo(rad(8));
		expect(t.sx).toBeCloseTo(0.85);
		expect(t.sy).toBeCloseTo(0.85);
		// No rotation: no rot key (and identity stays identity).
		expect(readScreenTransform({ transform: [{ translateX: 5 }, { scale: 2 }] }, W, H).rot).toBeUndefined();
		expect(readScreenTransform({ transform: [{ rotate: "0.1rad" }] }, W, H).rot).toBeCloseTo(0.1);
	});

	it("recovers a layout box from a turned screen's measurement (its bounds)", () => {
		const screen: ScreenTransform = { sx: 0.85, sy: 0.85, tx: 40, ty: -60, rot: rad(-8), width: W, height: H };
		const layout = { pageX: 20, pageY: 300, width: 360, height: 130 };
		const measured = boundingBox(layout, toAffine(screen));
		expect(measured.width).toBeGreaterThan(layout.width * 0.85);
		const back = toLayoutSpace(measured, screen);
		expect(back.pageX).toBeCloseTo(layout.pageX, 3);
		expect(back.pageY).toBeCloseTo(layout.pageY, 3);
		expect(back.width).toBeCloseTo(layout.width, 3);
		expect(back.height).toBeCloseTo(layout.height, 3);
	});

	it("an element drawn inside a turned screen lands straight on a straight one", () => {
		// The element is drawn inside the closing screen (tilted, shrunk, moved) and has arrived at
		// the destination's slot (t = 1), which is straight: it must come out exactly there, unturned.
		const slot = { pageX: 20, pageY: 300, width: 360, height: 130 };
		const closing: ScreenTransform = { sx: 0.9, sy: 0.9, tx: 380, ty: -250, rot: rad(-8), width: W, height: H };
		const style = attachBoundsScreenFrame(
			{ transform: [{ translateX: 0 }, { translateY: 0 }] },
			{
				tag: "wisp",
				t: 1,
				sourceScreenKey: "closing",
				destinationScreenKey: "below",
				screenKey: "closing",
				layout: { ...slot, x: slot.pageX, y: slot.pageY },
				start: { ...slot, x: slot.pageX, y: slot.pageY },
				end: { ...slot, x: slot.pageX, y: slot.pageY },
				startChain: [],
			},
		);
		const placed = applyBoundsScreenFrames(
			{ wisp: { style } },
			{ closing, below: { sx: 1, sy: 1, tx: 0, ty: 0, width: W, height: H } },
		);
		const items = placed.wisp?.style?.transform as Record<string, number | string>[];
		const center = { x: slot.pageX + slot.width / 2, y: slot.pageY + slot.height / 2 };
		// Drawn: the closing screen's transform after the element's own (correction first).
		const drawn = compose(toAffine(closing), affineOf(items, center));
		for (const [x, y] of [
			[slot.pageX, slot.pageY],
			[slot.pageX + slot.width, slot.pageY],
			[slot.pageX, slot.pageY + slot.height],
		]) {
			const [dx, dy] = apply(drawn, x, y);
			expect(dx).toBeCloseTo(x, 3);
			expect(dy).toBeCloseTo(y, 3);
		}
	});
});
