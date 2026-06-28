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
				placement: "cross-screen-close",
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
				placement: "cross-screen-close",
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
				placement: "cross-screen-close",
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

	it("composes with the attached host's own scroll compensation", () => {
		setPortalHostBounds("scroll-host", {
			...createBounds(0, -50, 400, 800),
			scroll: createScrollLayout(0, 50),
		});

		// Host travelled 100 (150 - 50): adjusted host pageY = -50 - 100 = -150.
		// Source travelled 150 (250 - 100): source pageY = 220 - 150 = 70.
		expect(
			resolvePortalOffsetStyle({
				hostKey: "scroll-host",
				placement: "cross-screen-close",
				bounds: {
					...createBounds(40, 220, 100, 80),
					scroll: createScrollLayout(0, 100),
				} as any,
				trackSourceScroll: true,
				hostCurrentScroll: createScrollLayout(0, 150),
				sourceCurrentScroll: createScrollLayout(0, 250),
			}),
		).toEqual({
			transform: [{ translateY: 220 }, { translateX: 40 }],
		});
	});

	it("phases attached host scroll compensation with progress", () => {
		setPortalHostBounds("scroll-host", {
			...createBounds(20, 50, 400, 800),
			scroll: createScrollLayout(5, 10),
		});

		const params = {
			hostKey: "scroll-host",
			placement: "cross-screen-close" as const,
			bounds: createBounds(80, 200, 100, 80),
			hostCurrentScroll: createScrollLayout(15, 40),
		};

		expect(
			resolvePortalOffsetStyle({
				...params,
				hostProgress: 1,
			}),
		).toEqual({
			transform: [{ translateY: 150 }, { translateX: 60 }],
		});

		expect(
			resolvePortalOffsetStyle({
				...params,
				hostProgress: 0.5,
			}),
		).toEqual({
			transform: [{ translateY: 165 }, { translateX: 65 }],
		});

		expect(
			resolvePortalOffsetStyle({
				...params,
				hostProgress: 0,
			}),
		).toEqual({
			transform: [{ translateY: 180 }, { translateX: 70 }],
		});
	});

	it("applies the source delta without registered host bounds", () => {
		expect(
			resolvePortalOffsetStyle({
				hostKey: "unregistered-host",
				placement: "cross-screen-open",
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
				placement: "cross-screen-close",
				bounds: createBounds(40, 220, 100, 80),
				trackSourceScroll: true,
				sourceCurrentScroll: null,
			}),
		).toEqual({
			transform: [{ translateY: 220 }, { translateX: 40 }],
		});
	});

	it("keeps the host scroll fallback chain untouched by source compensation", () => {
		setPortalHostBounds("scroll-host", {
			...createBounds(0, -50, 400, 800),
			scroll: createScrollLayout(0, 50),
		});

		// No hostCurrentScroll: the chain falls back to the bounds snapshot as the
		// host's current scroll (pre-existing behavior, pinned). deltaB = 100 - 50.
		const withoutSourceCompensation = resolvePortalOffsetStyle({
			hostKey: "scroll-host",
			placement: "cross-screen-close",
			bounds: {
				...createBounds(40, 220, 100, 80),
				scroll: createScrollLayout(0, 100),
			} as any,
		});

		expect(withoutSourceCompensation).toEqual({
			transform: [{ translateY: 320 }, { translateX: 40 }],
		});

		// Source compensation adds its own delta on top without re-routing the
		// chain: deltaA = 250 - 100 shifts the source rect only.
		expect(
			resolvePortalOffsetStyle({
				hostKey: "scroll-host",
				placement: "cross-screen-close",
				bounds: {
					...createBounds(40, 220, 100, 80),
					scroll: createScrollLayout(0, 100),
				} as any,
				trackSourceScroll: true,
				sourceCurrentScroll: createScrollLayout(0, 250),
			}),
		).toEqual({
			transform: [{ translateY: 170 }, { translateX: 40 }],
		});
	});
});
