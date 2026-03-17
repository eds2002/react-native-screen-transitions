import { beforeEach, describe, expect, it } from "bun:test";
import {
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
} from "../constants";
import type { ScreenTransitionState } from "../types/animation.types";
import { createBoundsAccessor } from "../utils/bounds";
import { buildZoomStyles } from "../utils/bounds/zoom";
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

type ZoomFrameProps = Parameters<typeof buildZoomStyles>[0]["props"];

const createFrameProps = ({
	current,
	previous,
	next,
	focused,
	progress,
	active,
	inactive,
	navigationMaskEnabled = true,
}: {
	current: ScreenTransitionState;
	previous?: ScreenTransitionState;
	next?: ScreenTransitionState;
	focused: boolean;
	progress: number;
	active: ScreenTransitionState;
	inactive?: ScreenTransitionState;
	navigationMaskEnabled?: boolean;
}): ZoomFrameProps => ({
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
	navigationMaskEnabled,
	active,
	inactive,
});

const getTransformScale = (
	styles: ReturnType<typeof buildZoomStyles>,
	key: string,
): number | undefined => {
	const transform = (
		styles[key] as {
			style?: {
				transform?: Array<Record<string, number>>;
			};
		}
	)?.style?.transform;

	return transform?.find((entry) => "scale" in entry)?.scale;
};

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

		expect(styles[NAVIGATION_CONTAINER_STYLE_ID]).toEqual({
			style: {
				opacity: 0.5,
				transform: [
					{ translateX: 12 },
					{ translateY: 24 },
					{ scale: 1.1 },
				],
			},
		});
		expect(styles[NAVIGATION_MASK_STYLE_ID]).toEqual({
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

	it("keeps navigation container and mask slots when navigation masking is disabled", () => {
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
			navigationMaskEnabled: false,
		});

		const styles = buildZoomStyles({
			id: "album-art",
			props,
			resolveTag,
			zoomOptions: {
				mask: {
					borderRadius: 16,
					borderCurve: "continuous",
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

		expect(styles[NAVIGATION_CONTAINER_STYLE_ID]).toEqual({
			style: {
				opacity: 0.5,
				transform: [
					{ translateX: 12 },
					{ translateY: 24 },
					{ scale: 1.1 },
				],
			},
		});
		expect(styles[NAVIGATION_MASK_STYLE_ID]).toEqual({
			style: {
				width: 120,
				height: 180,
				transform: [
					{ translateX: 40 },
					{ translateY: 50 },
					{ scale: 1 },
				],
				borderRadius: 16,
				borderTopLeftRadius: 16,
				borderTopRightRadius: 16,
				borderBottomLeftRadius: 16,
				borderBottomRightRadius: 16,
				borderCurve: "continuous",
			},
		});
		expect(styles.content).toBeUndefined();
		expect(styles["album-art"]).toEqual({
			style: { opacity: 1 },
		});
	});

	it("shrinks in the dismissal direction and slightly lifts in the opposite direction", () => {
		registerSourceAndDestination({
			tag: "album-art",
			sourceScreenKey: "list",
			destinationScreenKey: "detail",
			sourceBounds: createBounds(10, 20, 120, 160),
			destinationBounds: createBounds(0, 0, 300, 400),
		});

		const previous = createState("list");
		const makeFocusedStyles = ({
			direction,
			normX = 0,
			normY,
		}: {
			direction: ScreenTransitionState["gesture"]["direction"];
			normX?: number;
			normY: number;
		}) => {
			const current = createState("detail", {
				gesture: createGesture({
					direction,
					normX,
					normY,
					normalizedX: normX,
					normalizedY: normY,
				}),
			});
			const props = createFrameProps({
				current,
				previous,
				focused: true,
				progress: 0.25,
				active: current,
				inactive: previous,
			});

			return buildZoomStyles({
				id: "album-art",
				props,
				resolveTag,
				computeRaw: (overrides) => {
					if (overrides.method === "content") {
						return {
							translateX: 0,
							translateY: 0,
							scale: 1,
						};
					}

					return {
						width: 120,
						height: 180,
						translateX: 0,
						translateY: 0,
					};
				},
			});
		};

		const verticalDismiss = makeFocusedStyles({
			direction: "vertical",
			normY: 1,
		});
		const verticalOpposite = makeFocusedStyles({
			direction: "vertical",
			normY: -1,
		});
		const verticalInvertedDismiss = makeFocusedStyles({
			direction: "vertical-inverted",
			normY: -1,
		});
		const verticalInvertedOpposite = makeFocusedStyles({
			direction: "vertical-inverted",
			normY: 1,
		});
		const horizontalDismiss = makeFocusedStyles({
			direction: "horizontal",
			normX: 1,
			normY: 0,
		});
		const horizontalOpposite = makeFocusedStyles({
			direction: "horizontal",
			normX: -1,
			normY: 0,
		});
		const horizontalInvertedDismiss = makeFocusedStyles({
			direction: "horizontal-inverted",
			normX: -1,
			normY: 0,
		});
		const horizontalInvertedOpposite = makeFocusedStyles({
			direction: "horizontal-inverted",
			normX: 1,
			normY: 0,
		});

		expect(
			getTransformScale(verticalDismiss, NAVIGATION_CONTAINER_STYLE_ID),
		).toBeLessThan(
			1,
		);
		expect(
			getTransformScale(verticalOpposite, NAVIGATION_CONTAINER_STYLE_ID),
		).toBeGreaterThan(1);
		expect(
			getTransformScale(verticalInvertedDismiss, NAVIGATION_CONTAINER_STYLE_ID),
		).toBeLessThan(1);
		expect(
			getTransformScale(verticalInvertedOpposite, NAVIGATION_CONTAINER_STYLE_ID),
		).toBeGreaterThan(1);
		expect(
			getTransformScale(horizontalDismiss, NAVIGATION_CONTAINER_STYLE_ID),
		).toBeLessThan(1);
		expect(
			getTransformScale(horizontalOpposite, NAVIGATION_CONTAINER_STYLE_ID),
		).toBeGreaterThan(1);
		expect(
			getTransformScale(horizontalInvertedDismiss, NAVIGATION_CONTAINER_STYLE_ID),
		).toBeLessThan(1);
		expect(
			getTransformScale(horizontalInvertedOpposite, NAVIGATION_CONTAINER_STYLE_ID),
		).toBeGreaterThan(1);
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
		expect(styles[NAVIGATION_CONTAINER_STYLE_ID]).toBeUndefined();
		expect(styles[NAVIGATION_MASK_STYLE_ID]).toBeUndefined();
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

		expect(styles[NAVIGATION_CONTAINER_STYLE_ID]).toBeDefined();
		expect(styles[NAVIGATION_MASK_STYLE_ID]).toBeDefined();
		expect(styles["album-art"]).toBeDefined();
		expect(
			(
				styles[NAVIGATION_MASK_STYLE_ID] as {
					style?: { borderRadius?: number };
				}
			).style?.borderRadius,
		).toBe(18);
	});
});
