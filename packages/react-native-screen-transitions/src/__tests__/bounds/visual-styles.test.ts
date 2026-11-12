import { describe, expect, it } from "bun:test";
import {
	pickVisualStyle,
	resolveVisualStyle,
	transformScale,
} from "../../utils/bounds/helpers/styles/visual-styles";

describe("a boundary's look travels with it", () => {
	it("keeps only the visual props of a style", () => {
		expect(
			pickVisualStyle({ width: 100, margin: 4, borderRadius: 12, backgroundColor: "#fff", opacity: 0.5 }),
		).toEqual({ borderRadius: 12, opacity: 0.5 });
		expect(pickVisualStyle({ width: 100 })).toBeNull();
		expect(pickVisualStyle(null)).toBeNull();
	});

	it("draws corners at their true size under the element's scale", () => {
		// A 12 pt card halfway to a 0 pt photo, laid out at the photo's size and drawn at half of it:
		// the corner is 6 pt on screen, so 12 pt on the scaled box.
		const style = resolveVisualStyle({ borderRadius: 12 }, { borderRadius: 0 }, 0.5, 0.5, 0.5);
		expect(style?.borderRadius).toBeCloseTo(12);
		// Unscaled (the size method): the plain blend.
		expect(resolveVisualStyle({ borderRadius: 12 }, { borderRadius: 0 }, 0.5, 1, 1)?.borderRadius).toBeCloseTo(6);
		// At either end, exactly that end's corner as drawn.
		expect(resolveVisualStyle({ borderRadius: 12 }, { borderRadius: 40 }, 0, 0.25, 0.25)?.borderRadius).toBeCloseTo(48);
		expect(resolveVisualStyle({ borderRadius: 12 }, { borderRadius: 40 }, 1, 1, 1)?.borderRadius).toBeCloseTo(40);
	});

	it("blends per-corner radii, falling back to the end's borderRadius", () => {
		const style = resolveVisualStyle(
			{ borderRadius: 20 },
			{ borderTopLeftRadius: 0, borderRadius: 10 },
			0.5,
			1,
			1,
		);
		expect(style?.borderTopLeftRadius).toBeCloseTo(10); // 20 -> 0
		expect(style?.borderRadius).toBeCloseTo(15); // 20 -> 10
	});

	it("goes to or from neutral for a prop only one end sets", () => {
		const style = resolveVisualStyle({ borderRadius: 16, opacity: 0.5 }, {}, 0.5, 1, 1);
		expect(style?.borderRadius).toBeCloseTo(8);
		expect(style?.opacity).toBeCloseTo(0.75);
	});

	it("scales border widths and shadows like corners, offsets per axis", () => {
		const style = resolveVisualStyle(
			{ borderWidth: 2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
			{ borderWidth: 2, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
			0.3,
			2,
			2,
		);
		expect(style?.borderWidth).toBeCloseTo(1);
		expect(style?.shadowRadius).toBeCloseTo(4);
		expect(style?.shadowOffset).toEqual({ width: 0, height: 2 });
	});

	it("uses the mean scale for one-value props under an uneven scale", () => {
		const style = resolveVisualStyle({ borderRadius: 12 }, { borderRadius: 12 }, 0.5, 4, 1);
		expect(style?.borderRadius).toBeCloseTo(6);
	});

	it("leaves colors out: they don't travel", () => {
		expect(pickVisualStyle({ backgroundColor: "#000000", borderColor: "#fff" })).toBeNull();
		expect(
			resolveVisualStyle({ backgroundColor: "#000000" }, { backgroundColor: "#ffffff" }, 0.5, 1, 1),
		).toBeNull();
	});

	it("leaves a key either end can't blend (a percentage radius) to the element", () => {
		const style = resolveVisualStyle({ borderRadius: "50%", borderWidth: 2 }, { borderRadius: 12, borderWidth: 4 }, 0.5, 1, 1);
		expect(style?.borderRadius).toBeUndefined();
		expect(style?.borderWidth).toBeCloseTo(3);
		// A corner falling back to a percentage shorthand can't blend either.
		const corner = resolveVisualStyle({ borderRadius: "50%" }, { borderTopLeftRadius: 0 }, 0.5, 1, 1);
		expect(corner?.borderTopLeftRadius).toBeUndefined();
	});

	it("leaves the keys the interpolator sets itself, but always resolves opacity", () => {
		const style = resolveVisualStyle(
			{ borderRadius: 12, shadowRadius: 4, opacity: 0.5 },
			{ borderRadius: 0, shadowRadius: 8, opacity: 1 },
			0.5,
			1,
			1,
			{ borderRadius: 3, opacity: 0.2 },
		);
		expect(style?.borderRadius).toBeUndefined();
		expect(style?.shadowRadius).toBeCloseTo(6);
		expect(style?.opacity).toBeCloseTo(0.75);
	});

	it("picks a shadow offset as a copy", () => {
		const offset = { width: 0, height: 8 };
		const look = pickVisualStyle({ shadowOffset: offset, shadowRadius: 12 });
		expect(look?.shadowOffset).toEqual(offset);
		expect(look?.shadowOffset).not.toBe(offset);
	});

	it("reads the scale a transform draws at, per axis", () => {
		expect(transformScale([{ translateX: 10 }, { scale: 2 }, { scaleX: 0.5 }, { rotate: "10deg" }])).toEqual({ x: 1, y: 2 });
		expect(transformScale(undefined)).toEqual({ x: 1, y: 1 });
	});

	it("has nothing to set when neither end has a look", () => {
		expect(resolveVisualStyle(null, null, 0.5, 1, 1)).toBeNull();
	});
});
