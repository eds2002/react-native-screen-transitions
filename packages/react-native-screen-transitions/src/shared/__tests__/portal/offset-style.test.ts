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

describe("resolvePortalOffsetStyle source scroll compensation", () => {
	it("shifts the source rect by the clamped source scroll travel", () => {
		setPortalHostBounds("host", createBounds(0, 0, 400, 800));

		// Source scrolled from 100 to 250 since measure: deltaY = 150, deltaX = 10.
		expect(
			resolvePortalOffsetStyle({
				hostKey: "host",
				placement: "cross-screen",
				bounds: {
					...createBounds(40, 220, 100, 80),
					scroll: createScrollLayout(5, 100),
				} as any,
				trackSourceScroll: true,
				sourceCurrentScroll: createScrollLayout(15, 250),
			}),
		).toEqual({
			transform: [{ translateY: 70 }, { translateX: 30 }],
		});
	});

	it("ignores source scroll inputs while compensation is off", () => {
		setPortalHostBounds("host", createBounds(0, 0, 400, 800));

		expect(
			resolvePortalOffsetStyle({
				hostKey: "host",
				placement: "cross-screen",
				bounds: {
					...createBounds(40, 220, 100, 80),
					scroll: createScrollLayout(5, 100),
				} as any,
				sourceCurrentScroll: createScrollLayout(15, 250),
			}),
		).toEqual({
			transform: [{ translateY: 220 }, { translateX: 40 }],
		});
	});

	it("clamps rubber-band source offsets to the layout range", () => {
		setPortalHostBounds("host", createBounds(0, 0, 400, 800));

		// Live offset 1000 overshoots the 600 scrollable range: deltaY = 600 - 100.
		expect(
			resolvePortalOffsetStyle({
				hostKey: "host",
				placement: "cross-screen",
				bounds: {
					...createBounds(0, 700, 100, 80),
					scroll: createScrollLayout(0, 100),
				} as any,
				trackSourceScroll: true,
				sourceCurrentScroll: createScrollLayout(0, 1000),
			}),
		).toEqual({
			transform: [{ translateY: 200 }, { translateX: 0 }],
		});
	});

	it("does not manually propagate destination host scroll", () => {
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

	it("composes source tracking with the chosen host position", () => {
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
				trackSourceScroll: true,
				sourceCurrentScroll: createScrollLayout(0, 250),
			}),
		).toEqual({
			transform: [{ translateY: 120 }, { translateX: 40 }],
		});
	});

	it("applies the source delta without registered host bounds", () => {
		expect(
			resolvePortalOffsetStyle({
				hostKey: "unregistered-host",
				placement: "cross-screen",
				bounds: {
					...createBounds(40, 220, 100, 80),
					scroll: createScrollLayout(0, 100),
				} as any,
				trackSourceScroll: true,
				sourceCurrentScroll: createScrollLayout(0, 250),
			}),
		).toEqual({
			transform: [{ translateY: 70 }, { translateX: 40 }],
		});
	});

	it("treats untracked source scroll as zero travel", () => {
		setPortalHostBounds("host", createBounds(0, 0, 400, 800));

		expect(
			resolvePortalOffsetStyle({
				hostKey: "host",
				placement: "cross-screen",
				bounds: createBounds(40, 220, 100, 80),
				trackSourceScroll: true,
				sourceCurrentScroll: null,
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
