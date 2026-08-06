import { describe, expect, it } from "bun:test";
import { resolvePortalOffsetStyle } from "../../components/boundary/portal/components/boundary-portal/helpers/offset-style";

const createBounds = (x = 0, y = 0, width = 100, height = 100) => ({
	x,
	y,
	pageX: x,
	pageY: y,
	width,
	height,
});

describe("resolvePortalOffsetStyle", () => {
	it("places a boundary relative to the current host frame", () => {
		expect(
			resolvePortalOffsetStyle({
				bounds: createBounds(40, 220, 100, 80),
				hostBounds: createBounds(12, -50, 400, 800),
			}),
		).toEqual({
			transform: [{ translateY: 270 }, { translateX: 28 }],
		});
	});

	it("uses boundary page coordinates without registered host bounds", () => {
		expect(
			resolvePortalOffsetStyle({
				bounds: createBounds(40, 220, 100, 80),
				hostBounds: null,
			}),
		).toEqual({
			transform: [{ translateY: 220 }, { translateX: 40 }],
		});
	});
});
