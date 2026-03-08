import { beforeEach, describe, expect, it } from "bun:test";
import type { ScreenInterpolationProps, ScreenTransitionState } from "../types/animation.types";
import { createBoundsAccessor } from "../utils/bounds";
import {
	buildZoomStyles,
	ZOOM_CONTAINER_STYLE_ID,
	ZOOM_MASK_STYLE_ID,
} from "../utils/bounds/zoom";
import { createBounds, registerSourceAndDestination } from "./helpers/bounds-behavior-fixtures";

const resolveTag = ({
	id,
	group,
}: {
	id?: string;
	group?: string;
}) => (group ? `${group}:${id}` : id);

const createGesture = (
	overrides: Partial<ScreenTransitionState["gesture"]> = {},
): ScreenTransitionState["gesture"] => ({
	x: 0,
	y: 0,
	normX: 0,
	normY: 0,
	dismissing: 0,
	dragging: 0,
	direction: null,
	normalizedX: 0,
	normalizedY: 0,
	isDismissing: 0,
	isDragging: 0,
	...overrides,
});

const createState = (
	key: string,
	overrides: Partial<ScreenTransitionState> = {},
): ScreenTransitionState => ({
	progress: 1,
	closing: 0,
	entering: 1,
	animating: 1,
	settled: 0,
	gesture: createGesture(),
	meta: undefined,
	route: {
		key,
		name: key,
	},
	...overrides,
});

const createFrameProps = ({
	current,
	previous,
	next,
	focused,
	progress,
	active,
	inactive,
}: {
	current: ScreenTransitionState;
	previous?: ScreenTransitionState;
	next?: ScreenTransitionState;
	focused: boolean;
	progress: number;
	active: ScreenTransitionState;
	inactive?: ScreenTransitionState;
}): Omit<ScreenInterpolationProps, "bounds"> => ({
	previous,
	current,
	next,
	layouts: {
		screen: {
			width: 300,
			height: 600,
		},
	},
	insets: {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	},
	focused,
	progress,
	stackProgress: progress,
	snapIndex: -1,
	active,
	inactive,
	isActiveTransitioning: active.animating === 1,
	isDismissing: active.closing === 1,
});

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("bounds navigation zoom", () => {
	it("returns container, mask, and matched-element entries for the focused branch", () => {
		registerSourceAndDestination({
			tag: "album-art",
			sourceScreenKey: "list",
			destinationScreenKey: "detail",
			sourceBounds: createBounds(10, 20, 120, 160),
			destinationBounds: createBounds(0, 0, 300, 400),
		});

		const previous = createState("list");
		const current = createState("detail", {
			gesture: createGesture(),
		});
		const props = createFrameProps({
			current,
			previous,
			focused: true,
			progress: 0.25,
			active: current,
			inactive: previous,
		});

		const styles = buildZoomStyles({
			id: "album-art",
			props,
			resolveTag,
			zoomOptions: {
				mask: {
					borderRadius: 16,
					outset: 10,
				},
			},
			computeRaw: (overrides) => {
				if (overrides.method === "content") {
					return {
						translateX: 12,
						translateY: 24,
						scale: 1.1,
					};
				}

				return {
					width: 120,
					height: 180,
					translateX: 40,
					translateY: 50,
				};
			},
		});

		expect(styles[ZOOM_CONTAINER_STYLE_ID]).toEqual({
			style: {
				opacity: 0.5,
				transform: [
					{ translateX: 12 },
					{ translateY: 24 },
					{ scale: 1.1 },
				],
			},
		});
		expect(styles[ZOOM_MASK_STYLE_ID]).toEqual({
			style: {
				width: 140,
				height: 200,
				transform: [
					{ translateX: 30 },
					{ translateY: 40 },
					{ scale: 1 },
				],
				borderRadius: 16,
				borderTopLeftRadius: 16,
				borderTopRightRadius: 16,
				borderBottomLeftRadius: 16,
				borderBottomRightRadius: 16,
			},
		});
		expect(styles["album-art"]).toEqual({
			style: { opacity: 1 },
		});
	});

	it("returns content shrink and matched-element transform entries for the unfocused branch", () => {
		registerSourceAndDestination({
			tag: "album-art",
			sourceScreenKey: "list",
			destinationScreenKey: "detail",
			sourceBounds: createBounds(10, 20, 120, 160),
			destinationBounds: createBounds(0, 0, 300, 400),
		});

		const current = createState("list");
		const next = createState("detail", {
			gesture: createGesture(),
			settled: 0,
		});
		const props = createFrameProps({
			current,
			next,
			focused: false,
			progress: 1.25,
			active: next,
			inactive: current,
		});

		const styles = buildZoomStyles({
			id: "album-art",
			props,
			resolveTag,
			computeRaw: () => ({
				translateX: 14,
				translateY: 18,
				scaleX: 0.9,
				scaleY: 0.8,
			}),
		});

		expect(styles.content).toEqual({
			style: {
				transform: [{ scale: 0.9875 }],
			},
		});
		expect(styles["album-art"]).toEqual({
			style: {
				transform: [
					{ translateX: 14 },
					{ translateY: 18 },
					{ scaleX: 0.9 },
					{ scaleY: 0.8 },
				],
				opacity: 0.5,
				zIndex: 9999,
				elevation: 9999,
			},
		});
		expect(styles[ZOOM_CONTAINER_STYLE_ID]).toBeUndefined();
		expect(styles[ZOOM_MASK_STYLE_ID]).toBeUndefined();
	});

	it("keeps bounds({ id }).navigation.zoom() wired through the zoom module", () => {
		registerSourceAndDestination({
			tag: "album-art",
			sourceScreenKey: "list",
			destinationScreenKey: "detail",
			sourceBounds: createBounds(10, 20, 120, 160),
			destinationBounds: createBounds(0, 0, 300, 400),
		});

		const previous = createState("list");
		const current = createState("detail", {
			gesture: createGesture(),
		});
		const props = createFrameProps({
			current,
			previous,
			focused: true,
			progress: 0.25,
			active: current,
			inactive: previous,
		});

		const bounds = createBoundsAccessor(() => props);
		const styles = bounds({ id: "album-art" }).navigation.zoom({
			mask: {
				borderRadius: 18,
			},
		});

		expect(styles[ZOOM_CONTAINER_STYLE_ID]).toBeDefined();
		expect(styles[ZOOM_MASK_STYLE_ID]).toBeDefined();
		expect(styles["album-art"]).toBeDefined();
		expect(
			(
				styles[ZOOM_MASK_STYLE_ID] as {
					style?: { borderRadius?: number };
				}
			).style?.borderRadius,
		).toBe(18);
	});
});
