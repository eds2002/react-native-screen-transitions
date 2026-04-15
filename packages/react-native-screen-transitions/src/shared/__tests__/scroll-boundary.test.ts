import { describe, expect, it } from "bun:test";
import type {
	ScrollGestureAxisState,
	ScrollGestureState,
} from "../providers/screen/gestures";
import { checkScrollBoundary } from "../providers/screen/gestures/helpers/gesture-activation";

type ScrollStateOverrides = Partial<
	Omit<ScrollGestureState, "vertical" | "horizontal">
> & {
	vertical?: Partial<ScrollGestureAxisState>;
	horizontal?: Partial<ScrollGestureAxisState>;
};

function createScrollState(
	overrides: ScrollStateOverrides = {},
): ScrollGestureState {
	const { vertical, horizontal, ...rest } = overrides;

	return {
		vertical: {
			offset: 0,
			contentSize: 1000,
			layoutSize: 500,
			...vertical,
		},
		horizontal: {
			offset: 0,
			contentSize: 375,
			layoutSize: 375,
			...horizontal,
		},
		isTouched: true,
		...rest,
	};
}

describe("checkScrollBoundary", () => {
	it("returns true for all directions when no ScrollView is coordinated", () => {
		expect(checkScrollBoundary(null, "vertical")).toBe(true);
		expect(checkScrollBoundary(null, "vertical-inverted")).toBe(true);
		expect(checkScrollBoundary(null, "horizontal")).toBe(true);
		expect(checkScrollBoundary(null, "horizontal-inverted")).toBe(true);
	});

	describe("non-sheet screens", () => {
		it("treats vertical start as the boundary for swipe down", () => {
			expect(
				checkScrollBoundary(createScrollState({ vertical: { offset: 0 } }), "vertical"),
			).toBe(true);

			expect(
				checkScrollBoundary(
					createScrollState({ vertical: { offset: 100 } }),
					"vertical",
				),
			).toBe(false);
		});

		it("treats vertical end as the boundary for swipe up", () => {
			expect(
				checkScrollBoundary(
					createScrollState({ vertical: { offset: 500 } }),
					"vertical-inverted",
				),
			).toBe(true);

			expect(
				checkScrollBoundary(
					createScrollState({ vertical: { offset: 200 } }),
					"vertical-inverted",
				),
			).toBe(false);
		});

		it("treats horizontal start as the boundary for swipe right", () => {
			expect(
				checkScrollBoundary(
					createScrollState({
						horizontal: { offset: 0, contentSize: 1000, layoutSize: 375 },
					}),
					"horizontal",
				),
			).toBe(true);

			expect(
				checkScrollBoundary(
					createScrollState({
						horizontal: { offset: 100, contentSize: 1000, layoutSize: 375 },
					}),
					"horizontal",
				),
			).toBe(false);
		});

		it("treats horizontal end as the boundary for swipe left", () => {
			expect(
				checkScrollBoundary(
					createScrollState({
						horizontal: { offset: 625, contentSize: 1000, layoutSize: 375 },
					}),
					"horizontal-inverted",
				),
			).toBe(true);

			expect(
				checkScrollBoundary(
					createScrollState({
						horizontal: { offset: 200, contentSize: 1000, layoutSize: 375 },
					}),
					"horizontal-inverted",
				),
			).toBe(false);
		});
	});

	describe("snap point sheets", () => {
		it("uses start boundary for non-inverted sheets", () => {
			const state = createScrollState({ vertical: { offset: 0 } });
			const shiftedState = createScrollState({ vertical: { offset: 100 } });

			expect(checkScrollBoundary(state, "vertical", false)).toBe(true);
			expect(checkScrollBoundary(state, "vertical-inverted", false)).toBe(true);
			expect(checkScrollBoundary(shiftedState, "vertical", false)).toBe(false);
			expect(checkScrollBoundary(shiftedState, "vertical-inverted", false)).toBe(
				false,
			);
		});

		it("uses end boundary for inverted sheets", () => {
			const state = createScrollState({ vertical: { offset: 500 } });
			const shiftedState = createScrollState({ vertical: { offset: 200 } });

			expect(checkScrollBoundary(state, "vertical", true)).toBe(true);
			expect(checkScrollBoundary(state, "vertical-inverted", true)).toBe(true);
			expect(checkScrollBoundary(shiftedState, "vertical", true)).toBe(false);
			expect(checkScrollBoundary(shiftedState, "vertical-inverted", true)).toBe(
				false,
			);
		});

		it("uses the same start/end rule for drawers on the horizontal axis", () => {
			const rightDrawerState = createScrollState({
				horizontal: { offset: 0, contentSize: 1000, layoutSize: 375 },
			});
			const leftDrawerState = createScrollState({
				horizontal: { offset: 625, contentSize: 1000, layoutSize: 375 },
			});

			expect(checkScrollBoundary(rightDrawerState, "horizontal", false)).toBe(
				true,
			);
			expect(
				checkScrollBoundary(rightDrawerState, "horizontal-inverted", false),
			).toBe(true);
			expect(checkScrollBoundary(leftDrawerState, "horizontal", true)).toBe(true);
			expect(
				checkScrollBoundary(leftDrawerState, "horizontal-inverted", true),
			).toBe(true);
		});
	});

	describe("non-scrollable content", () => {
		it("passes vertical gestures when content fits in the viewport", () => {
			const state = createScrollState({
				vertical: { contentSize: 400, layoutSize: 500 },
			});

			expect(checkScrollBoundary(state, "vertical")).toBe(true);
			expect(checkScrollBoundary(state, "vertical-inverted")).toBe(true);
		});

		it("passes horizontal gestures when content fits in the viewport", () => {
			const state = createScrollState({
				horizontal: { contentSize: 300, layoutSize: 375 },
			});

			expect(checkScrollBoundary(state, "horizontal")).toBe(true);
			expect(checkScrollBoundary(state, "horizontal-inverted")).toBe(true);
		});
	});

	describe("axis isolation", () => {
		it("vertical scrolling does not block horizontal gestures without horizontal overflow", () => {
			const state = createScrollState({
				vertical: { offset: 100, contentSize: 1000, layoutSize: 500 },
				horizontal: { offset: 0, contentSize: 375, layoutSize: 375 },
			});

			expect(checkScrollBoundary(state, "vertical")).toBe(false);
			expect(checkScrollBoundary(state, "horizontal")).toBe(true);
			expect(checkScrollBoundary(state, "horizontal-inverted")).toBe(true);
		});

		it("horizontal scrolling does not block vertical gestures without vertical overflow", () => {
			const state = createScrollState({
				vertical: { offset: 0, contentSize: 400, layoutSize: 500 },
				horizontal: { offset: 100, contentSize: 1000, layoutSize: 375 },
			});

			expect(checkScrollBoundary(state, "horizontal")).toBe(false);
			expect(checkScrollBoundary(state, "vertical")).toBe(true);
			expect(checkScrollBoundary(state, "vertical-inverted")).toBe(true);
		});
	});
});
