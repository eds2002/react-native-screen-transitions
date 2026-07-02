import { beforeEach, describe, expect, it } from "bun:test";
import { setPortalHostBounds } from "../../components/boundary/portal/stores/host-bounds.store";
import { resolvePortalOffsetStyle } from "../../components/boundary/portal/utils/offset-style";

const createBounds = (x = 0, y = 0, width = 100, height = 100) => ({
	x,
	y,
	pageX: x,
	pageY: y,
	width,
	height,
});

const createScrollLayout = (x = 0, y = 0) => ({
	vertical: { offset: y, contentSize: 1000, layoutSize: 400 },
	horizontal: { offset: x, contentSize: 1000, layoutSize: 400 },
	isTouched: false,
});

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("resolvePortalOffsetStyle", () => {
	it("places cross-screen hosts relative to the chosen host frame", () => {
		setPortalHostBounds("scroll-host", {
			...createBounds(0, -50, 400, 800),
			scroll: createScrollLayout(0, 50),
		});

		expect(
			resolvePortalOffsetStyle({
				hostKey: "scroll-host",
				placement: "cross-screen",
				bounds: {
					...createBounds(40, 220, 100, 80),
					scroll: createScrollLayout(0, 100),
				} as any,
			}),
		).toEqual({
			transform: [{ translateY: 270 }, { translateX: 40 }],
		});
	});

	it("uses source page coordinates without registered host bounds", () => {
		expect(
			resolvePortalOffsetStyle({
				hostKey: "unregistered-host",
				placement: "cross-screen",
				bounds: {
					...createBounds(40, 220, 100, 80),
					scroll: createScrollLayout(0, 100),
				} as any,
			}),
		).toEqual({
			transform: [{ translateY: 220 }, { translateX: 40 }],
		});
	});

	it("re-bases same-screen host frames onto the source scroll snapshot", () => {
		setPortalHostBounds("scroll-host", {
			...createBounds(0, -50, 400, 800),
			scroll: createScrollLayout(0, 50),
		});

		expect(
			resolvePortalOffsetStyle({
				hostKey: "scroll-host",
				placement: "same-screen",
				bounds: {
					...createBounds(40, 220, 100, 80),
					scroll: createScrollLayout(0, 100),
				} as any,
			}),
		).toEqual({
			transform: [{ translateY: 320 }, { translateX: 40 }],
		});
	});
});
