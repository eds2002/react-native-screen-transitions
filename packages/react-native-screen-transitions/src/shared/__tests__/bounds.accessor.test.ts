import { beforeEach, describe, expect, it } from "bun:test";
import {
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_HOST_FLAG_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
} from "../constants";
import { BoundStore } from "../stores/bounds";
import { createBoundsAccessor } from "../utils/bounds";

const createMeasured = (
	x = 0,
	y = 0,
	width = 100,
	height = 100,
) => ({
	x,
	y,
	pageX: x,
	pageY: y,
	width,
	height,
});

const createAccessor = (
	currentKey = "screen-b",
	focused = true,
	progress = 0.5,
	options: {
		previousKey?: string;
		previousProgress?: number;
		previousClosing?: number;
		previousGestureX?: number;
		previousGestureY?: number;
		currentProgress?: number;
		activeClosing?: number;
		gestureX?: number;
		gestureY?: number;
		nextKey?: string;
		nextProgress?: number;
		nextClosing?: number;
		nextGestureX?: number;
		nextGestureY?: number;
	} = {},
) => {
	const previousKey = options.previousKey;
	const previousProgress = options.previousProgress ?? 1;
	const previousClosing = options.previousClosing ?? 0;
	const previousGestureX = options.previousGestureX ?? 0;
	const previousGestureY = options.previousGestureY ?? 0;
	const currentProgress = options.currentProgress ?? 1;
	const activeClosing = options.activeClosing ?? 0;
	const gestureX = options.gestureX ?? 0;
	const gestureY = options.gestureY ?? 0;
	const nextKey = options.nextKey;
	const nextProgress = options.nextProgress ?? 1;
	const nextClosing = options.nextClosing ?? 0;
	const nextGestureX = options.nextGestureX ?? 0;
	const nextGestureY = options.nextGestureY ?? 0;

	const nextState = nextKey
		? ({
				route: { key: nextKey },
				progress: nextProgress,
				closing: nextClosing,
				gesture: {
					x: nextGestureX,
					y: nextGestureY,
				},
			} as any)
		: undefined;

	const previousState = previousKey
		? ({
				route: { key: previousKey },
				progress: previousProgress,
				closing: previousClosing,
				gesture: {
					x: previousGestureX,
					y: previousGestureY,
				},
			} as any)
		: undefined;

	const frameProps = {
		previous: previousState,
		current: {
			route: { key: currentKey },
			progress: currentProgress,
			closing: activeClosing,
			gesture: {
				x: gestureX,
				y: gestureY,
			},
		} as any,
		next: nextState,
		layouts: { screen: { width: 400, height: 800 } },
		insets: { top: 0, right: 0, bottom: 0, left: 0 },
		focused,
		progress,
		stackProgress: 1,
		snapIndex: -1,
		active: {
			route: { key: currentKey },
			progress: currentProgress,
			closing: activeClosing,
			gesture: {
				x: gestureX,
				y: gestureY,
			},
		} as any,
		inactive: nextState,
		isActiveTransitioning: false,
		isDismissing: false,
	} as any;

	return createBoundsAccessor(() => {
		"worklet";
		return frameProps;
	});
};

const registerBasicLink = (tag = "card") => {
	BoundStore.setLinkSource(tag, "screen-a", createMeasured(0, 0, 100, 100));
	BoundStore.setLinkDestination(tag, "screen-b", createMeasured(100, 100, 220, 220));
};

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("createBounds accessor", () => {
	it("createBoundsAccessor keeps accessor identity stable while frame state updates", () => {
		registerBasicLink();

		let frameProps = {
			previous: undefined,
			current: {
				route: { key: "screen-b" },
				progress: 1,
				closing: 0,
				gesture: { x: 0, y: 0 },
			},
			next: undefined,
			layouts: { screen: { width: 400, height: 800 } },
			insets: { top: 0, right: 0, bottom: 0, left: 0 },
			focused: true,
			progress: 0,
			stackProgress: 1,
			snapIndex: -1,
			active: {
				route: { key: "screen-b" },
				progress: 1,
				closing: 0,
				gesture: { x: 0, y: 0 },
			},
			inactive: undefined,
			isActiveTransitioning: false,
			isDismissing: false,
		} as any;

		const bounds = createBoundsAccessor(() => {
			"worklet";
			return frameProps;
		});

		const firstRef = bounds;
		const before = bounds({
			id: "card",
			method: "transform",
			space: "relative",
			raw: true,
		}) as any;

		frameProps = {
			...frameProps,
			progress: 1,
		};

		const after = bounds({
			id: "card",
			method: "transform",
			space: "relative",
			raw: true,
		}) as any;

		expect(bounds).toBe(firstRef);
		expect(after.translateX).not.toBe(before.translateX);
		expect(after.translateY).not.toBe(before.translateY);
	});

	it("bounds({...}) produces deterministic style output for same options", () => {
		registerBasicLink();

		const bounds = createAccessor();
		const legacy = bounds({ id: "card", method: "transform", space: "relative" });
		const direct = bounds({ id: "card", method: "transform", space: "relative" });

		expect(direct).toEqual(legacy);
	});

	it("legacy bounds({...}) uses boundary defaults and allows per-call override", () => {
		registerBasicLink();
		BoundStore.registerBoundaryPresence("card", "screen-b", undefined, {
			method: "size",
		});

		const bounds = createAccessor();

		const fromBoundaryDefaults = bounds({ id: "card" }) as any;
		expect(fromBoundaryDefaults.width).toBeDefined();
		expect(fromBoundaryDefaults.height).toBeDefined();

		const overridden = bounds({ id: "card", method: "transform" }) as any;
		expect(overridden.width).toBeUndefined();
		expect(overridden.height).toBeUndefined();
	});

	it("bounds({...}) normalizes element styles to relative space", () => {
		registerBasicLink();
		const bounds = createAccessor();

		const relative = bounds({
			id: "card",
			method: "transform",
			space: "relative",
			raw: true,
		}) as any;
		const absolute = bounds({
			id: "card",
			method: "transform",
			space: "absolute",
			raw: true,
		}) as any;

		expect(relative.translateX).toBe(absolute.translateX);
		expect(relative.translateY).toBe(absolute.translateY);
	});

	it("bounds({...}) size mode keeps source geometry at progress=1 for unfocused screen", () => {
		registerBasicLink();

		const sourceBounds = createAccessor("screen-a", false, 1, {
			currentProgress: 1,
			nextKey: "screen-b",
			nextProgress: 0,
		});
		const sourceStyle = sourceBounds({
			id: "card",
			method: "size",
			raw: true,
		}) as any;

		expect(sourceStyle.width).toBe(100);
		expect(sourceStyle.height).toBe(100);
		expect(sourceStyle.translateX).toBe(0);
		expect(sourceStyle.translateY).toBe(0);
	});

	it("bounds({...}) size mode reaches destination geometry at progress=2 for unfocused screen", () => {
		registerBasicLink();

		const sourceBounds = createAccessor("screen-a", false, 2, {
			currentProgress: 1,
			nextKey: "screen-b",
			nextProgress: 1,
		});
		const sourceStyle = sourceBounds({
			id: "card",
			method: "size",
			raw: true,
		}) as any;

		expect(sourceStyle.width).toBe(220);
		expect(sourceStyle.height).toBe(220);
		expect(sourceStyle.translateX).toBe(100);
		expect(sourceStyle.translateY).toBe(100);
	});

	it("bounds({...}) recovers target bound from pending source + snapshot destination", () => {
		BoundStore.setLinkSource("card", "screen-a", createMeasured(0, 0, 100, 100));
		BoundStore.registerSnapshot(
			"card",
			"screen-b",
			createMeasured(100, 100, 220, 220),
		);

		const bounds = createAccessor("screen-b", true, 1, {
			previousKey: "screen-a",
		});
		const style = bounds({
			id: "card",
			method: "size",
			space: "absolute",
			target: "bound",
			raw: true,
		}) as any;

		expect(style.width).toBe(220);
		expect(style.height).toBe(220);
		expect(style.translateX).toBe(0);
		expect(style.translateY).toBe(0);
	});

	it("bounds({...}) keeps fullscreen target override when destination is unresolved", () => {
		BoundStore.setLinkSource("card", "screen-a", createMeasured(20, 30, 100, 100));

		const bounds = createAccessor("screen-b", true, 1, {
			previousKey: "screen-a",
		});
		const style = bounds({
			id: "card",
			method: "size",
			space: "absolute",
			target: "fullscreen",
			raw: true,
		}) as any;

		expect(style.width).toBe(400);
		expect(style.height).toBe(800);
	});

	it("bounds({...}) updates group active id", () => {
		const bounds = createAccessor();

		bounds({ id: "42", group: "feed" });

		expect(BoundStore.getGroupActiveId("feed")).toBe("42");
	});

	it("bounds({...}).navigation.hero() returns focused navigation styles and mask host flag", () => {
		registerBasicLink();
		const bounds = createAccessor("screen-b");

		const styles = bounds({ id: "card" }).navigation.hero();

		expect(styles[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]).toEqual({});
		expect(styles[NAVIGATION_CONTAINER_STYLE_ID]).toBeDefined();
		expect(styles[NAVIGATION_MASK_STYLE_ID]).toBeDefined();
		expect(styles.card).toBeUndefined();
	});

	it("bounds({...}).navigation.hero() returns unfocused shared-element style", () => {
		registerBasicLink();
		const bounds = createAccessor("screen-a", false);

		const styles = bounds({ id: "card" }).navigation.hero();

		expect(styles[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]).toBeUndefined();
		expect(styles.card).toBeDefined();
		expect(styles[NAVIGATION_CONTAINER_STYLE_ID]).toBeUndefined();
		expect(styles[NAVIGATION_MASK_STYLE_ID]).toBeUndefined();
	});

	it("bounds({...}).navigation.zoom() defaults to top anchoring and allows overrides", () => {
		registerBasicLink();
		BoundStore.registerBoundaryPresence("card", "screen-b", undefined, {
			anchor: "bottom",
		});
		const bounds = createAccessor("screen-b");

		const inherited = bounds({ id: "card" }).navigation.zoom();
		const overridden = bounds({
			id: "card",
			anchor: "center",
		}).navigation.zoom();

		expect(inherited[NAVIGATION_CONTAINER_STYLE_ID]).toBeDefined();
		expect(overridden[NAVIGATION_CONTAINER_STYLE_ID]).toBeDefined();
	});

	it("bounds({...}).navigation.zoom() uses top anchor preset when no boundary defaults exist", () => {
		registerBasicLink();
		const bounds = createAccessor("screen-b");

		const presetDefault = bounds({ id: "card" }).navigation.zoom();
		const explicitTop = bounds({ id: "card", anchor: "top" }).navigation.zoom();

		expect(presetDefault[NAVIGATION_CONTAINER_STYLE_ID]).toEqual(
			explicitTop[NAVIGATION_CONTAINER_STYLE_ID],
		);
	});

	it("bounds({...}).navigation.zoom() rejects per-call options at the type level", () => {
		registerBasicLink();
		const bounds = createAccessor("screen-b");
		const badZoomOptions = { anchor: "top" } as const;

		// @ts-expect-error zoom no longer accepts per-call options
		const styles = bounds({ id: "card" }).navigation.zoom(badZoomOptions);

		expect(styles[NAVIGATION_CONTAINER_STYLE_ID]).toBeDefined();
	});

	it("bounds({...}).navigation.zoom() inherits source defaults when destination boundary is missing", () => {
		BoundStore.setLinkSource(
			"card",
			"screen-a",
			createMeasured(32, 48, 96, 96),
		);
		BoundStore.registerBoundaryPresence("card", "screen-a", undefined, {
			scaleMode: "none",
		});

		const bounds = createAccessor("screen-b", true, 0.5);
		const styles = bounds({ id: "card" }).navigation.zoom();
		const containerStyle = styles[NAVIGATION_CONTAINER_STYLE_ID] as any;
		const contentScale = containerStyle.transform?.[2]?.scale;

		expect(contentScale).toBe(1);
	});

	it("bounds({...}).navigation.zoom() applies vertical anchor alignment to synthesized targets", () => {
		BoundStore.setLinkSource(
			"card",
			"screen-a",
			createMeasured(20, 40, 120, 120),
		);

		const bounds = createAccessor("screen-b", true, 0);
		const topStyles = bounds({
			id: "card",
			anchor: "top",
			scaleMode: "uniform",
		}).navigation.zoom();
		const bottomStyles = bounds({
			id: "card",
			anchor: "bottom",
			scaleMode: "uniform",
		}).navigation.zoom();

		const topTranslateY =
			(topStyles[NAVIGATION_CONTAINER_STYLE_ID] as any).transform?.[1]?.translateY;
		const bottomTranslateY = (bottomStyles[NAVIGATION_CONTAINER_STYLE_ID] as any)
			.transform?.[1]?.translateY;

		expect(bottomTranslateY).not.toBe(topTranslateY);
	});

	it("bounds({...}).navigation.zoom() enables mask host only for focused screen", () => {
		registerBasicLink();
		const focusedBounds = createAccessor("screen-b", true);
		const unfocusedBounds = createAccessor("screen-a", false);

		const focusedStyles = focusedBounds({ id: "card" }).navigation.zoom();
		const unfocusedStyles = unfocusedBounds({ id: "card" }).navigation.zoom();
		const focusedContainer = focusedStyles[NAVIGATION_CONTAINER_STYLE_ID] as any;

		expect(focusedStyles[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]).toEqual({});
		expect(unfocusedStyles[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]).toBeUndefined();
		expect(focusedContainer.opacity).toBeDefined();
	});

	it("bounds({...}).navigation.zoom() keeps full opacity when not closing", () => {
		registerBasicLink();
		const openingBounds = createAccessor("screen-b", true, 0.1, {
			activeClosing: 0,
			currentProgress: 0.1,
		});

		const openingStyles = openingBounds({ id: "card" }).navigation.zoom();
		const openingOpacity = (openingStyles[NAVIGATION_CONTAINER_STYLE_ID] as any)
			.opacity;

		expect(openingOpacity).toBe(1);
	});

	it("bounds({...}).navigation.zoom() fades focused screen only while closing", () => {
		registerBasicLink();
		const closingBounds = createAccessor("screen-b", true, 0.5, {
			activeClosing: 1,
			currentProgress: 0.4,
		});

		const closingStyles = closingBounds({ id: "card" }).navigation.zoom();
		const closingOpacity = (closingStyles[NAVIGATION_CONTAINER_STYLE_ID] as any)
			.opacity;

		expect(closingOpacity).toBe(0.4);
	});

	it("bounds({...}).navigation.zoom() scales unfocused content.style from 1 to 0.95", () => {
		registerBasicLink();
		const unfocusedBounds = createAccessor("screen-a", false, 1.5);
		const styles = unfocusedBounds({ id: "card" }).navigation.zoom();
		const contentStyle = (styles.content as any)?.style;
		const scaleEntry = contentStyle?.transform?.find(
			(entry: Record<string, number>) => "scale" in entry,
		);

		expect(scaleEntry?.scale).toBe(0.975);
	});

	it("bounds({...}).navigation.zoom() applies freeform drag to focused translation", () => {
		registerBasicLink();
		const baseline = createAccessor("screen-b", true, 0.5, {
			gestureX: 0,
			gestureY: 0,
		});
		const dragged = createAccessor("screen-b", true, 0.5, {
			gestureX: 24,
			gestureY: -18,
		});

		const baselineTransform = (
			baseline({ id: "card" }).navigation.zoom()[
				NAVIGATION_CONTAINER_STYLE_ID
			] as any
		).transform;
		const draggedTransform = (
			dragged({ id: "card" }).navigation.zoom()[
				NAVIGATION_CONTAINER_STYLE_ID
			] as any
		).transform;

		const baselineX = baselineTransform.find(
			(entry: Record<string, number>) => "translateX" in entry,
		)?.translateX;
		const baselineY = baselineTransform.find(
			(entry: Record<string, number>) => "translateY" in entry,
		)?.translateY;
		const draggedX = draggedTransform.find(
			(entry: Record<string, number>) => "translateX" in entry,
		)?.translateX;
		const draggedY = draggedTransform.find(
			(entry: Record<string, number>) => "translateY" in entry,
		)?.translateY;

		expect(draggedX - baselineX).toBeCloseTo(24, 5);
		expect(draggedY - baselineY).toBeCloseTo(-18, 5);
	});

	it("bounds({...}).navigation.zoom() applies freeform drag to focused mask", () => {
		registerBasicLink();
		const baseline = createAccessor("screen-b", true, 0.5, {
			gestureX: 0,
			gestureY: 0,
		});
		const dragged = createAccessor("screen-b", true, 0.5, {
			gestureX: 12,
			gestureY: 9,
		});

		const baselineMaskStyle = baseline({ id: "card" }).navigation.zoom()[
			NAVIGATION_MASK_STYLE_ID
		] as any;
		const draggedMaskStyle = dragged({ id: "card" }).navigation.zoom()[
			NAVIGATION_MASK_STYLE_ID
		] as any;
		const baselineTransform = baselineMaskStyle.transform;
		const draggedTransform = draggedMaskStyle.transform;

		const baselineX = baselineTransform.find(
			(entry: Record<string, number>) => "translateX" in entry,
		)?.translateX;
		const baselineY = baselineTransform.find(
			(entry: Record<string, number>) => "translateY" in entry,
		)?.translateY;
		const draggedX = draggedTransform.find(
			(entry: Record<string, number>) => "translateX" in entry,
		)?.translateX;
		const draggedY = draggedTransform.find(
			(entry: Record<string, number>) => "translateY" in entry,
		)?.translateY;

		expect(draggedX - baselineX).toBeGreaterThan(0);
		expect(draggedY - baselineY).toBeGreaterThan(0);
		expect(draggedX - baselineX).toBeLessThanOrEqual(12);
		expect(draggedY - baselineY).toBeLessThanOrEqual(9);
		expect(draggedMaskStyle.width).toBeLessThanOrEqual(baselineMaskStyle.width);
		expect(draggedMaskStyle.height).toBeLessThanOrEqual(
			baselineMaskStyle.height,
		);
	});

	it("bounds({...}).navigation.zoom() applies resistance to mask cropping distance", () => {
		registerBasicLink();
		const baseline = createAccessor("screen-b", true, 0.5, {
			gestureX: 0,
			gestureY: 0,
		});
		const dragged = createAccessor("screen-b", true, 0.5, {
			gestureX: 120,
			gestureY: 100,
		});

		const baselineMaskStyle = baseline({ id: "card" }).navigation.zoom()[
			NAVIGATION_MASK_STYLE_ID
		] as any;
		const draggedMaskStyle = dragged({ id: "card" }).navigation.zoom()[
			NAVIGATION_MASK_STYLE_ID
		] as any;

		expect(baselineMaskStyle.width - draggedMaskStyle.width).toBeCloseTo(0, 5);
		expect(baselineMaskStyle.height - draggedMaskStyle.height).toBeCloseTo(0, 5);
	});

	it("bounds({...}).navigation.zoom() scales focused container down as drag moves toward dismiss", () => {
		registerBasicLink();
		const baseline = createAccessor("screen-b", true, 0.5, {
			gestureX: 0,
			gestureY: 0,
		});
		const draggedDown = createAccessor("screen-b", true, 0.5, {
			gestureX: 0,
			gestureY: 120,
		});
		const draggedUp = createAccessor("screen-b", true, 0.5, {
			gestureX: 0,
			gestureY: -120,
		});

		const baselineContainer = baseline({ id: "card" }).navigation.zoom()[
			NAVIGATION_CONTAINER_STYLE_ID
		] as any;
		const downContainer = draggedDown({ id: "card" }).navigation.zoom()[
			NAVIGATION_CONTAINER_STYLE_ID
		] as any;
		const upContainer = draggedUp({ id: "card" }).navigation.zoom()[
			NAVIGATION_CONTAINER_STYLE_ID
		] as any;

		const baselineScale = baselineContainer.transform.find(
			(entry: Record<string, number>) => "scale" in entry,
		)?.scale;
		const downScale = downContainer.transform.find(
			(entry: Record<string, number>) => "scale" in entry,
		)?.scale;
		const upScale = upContainer.transform.find(
			(entry: Record<string, number>) => "scale" in entry,
		)?.scale;

		expect(downScale).toBeLessThanOrEqual(baselineScale);
		expect(downScale).toBeLessThanOrEqual(upScale);
	});

	it("bounds({...}).navigation.zoom() keeps unfocused content.style as scale-only", () => {
		registerBasicLink();
		const styles = createAccessor("screen-a", false, 1.5, {
			gestureX: -15,
			gestureY: 20,
		})
			({ id: "card" })
			.navigation.zoom();

		const contentTransform = (styles.content as any)?.style?.transform;
		const hasTranslateX = contentTransform?.some(
			(entry: Record<string, number>) => "translateX" in entry,
		);
		const hasTranslateY = contentTransform?.some(
			(entry: Record<string, number>) => "translateY" in entry,
		);

		expect(hasTranslateX).toBe(false);
		expect(hasTranslateY).toBe(false);
	});

	it("bounds({...}).navigation.zoom() applies freeform drag to unfocused source element", () => {
		registerBasicLink();
		const baseline = createAccessor("screen-a", false, 1.5, {
			gestureX: 0,
			gestureY: 0,
		});
		const dragged = createAccessor("screen-a", false, 1.5, {
			gestureX: -15,
			gestureY: 20,
		});

		const baselineTransform = (
			baseline({ id: "card" }).navigation.zoom().card as any
		).transform;
		const draggedTransform = (
			dragged({ id: "card" }).navigation.zoom().card as any
		).transform;

		const baselineX = baselineTransform.find(
			(entry: Record<string, number>) => "translateX" in entry,
		)?.translateX;
		const baselineY = baselineTransform.find(
			(entry: Record<string, number>) => "translateY" in entry,
		)?.translateY;
		const draggedX = draggedTransform.find(
			(entry: Record<string, number>) => "translateX" in entry,
		)?.translateX;
		const draggedY = draggedTransform.find(
			(entry: Record<string, number>) => "translateY" in entry,
		)?.translateY;

		expect(draggedX - baselineX).toBeLessThan(0);
		expect(draggedX - baselineX).toBeGreaterThan(-20);
		expect(draggedY - baselineY).toBeGreaterThan(0);
		expect(draggedY - baselineY).toBeLessThan(24);
	});

	it("bounds({...}).navigation.zoom() avoids extra Y offset in scaleMode match drag compensation", () => {
		registerBasicLink();
		const baseline = createAccessor("screen-a", false, 1.5, {
			gestureX: 0,
			gestureY: 0,
		});
		const dragged = createAccessor("screen-a", false, 1.5, {
			gestureX: 0,
			gestureY: 20,
		});

		const baselineTransform = (
			baseline({ id: "card", scaleMode: "match" }).navigation.zoom().card as any
		).transform;
		const draggedTransform = (
			dragged({ id: "card", scaleMode: "match" }).navigation.zoom().card as any
		).transform;

		const baselineY = baselineTransform.find(
			(entry: Record<string, number>) => "translateY" in entry,
		)?.translateY;
		const draggedY = draggedTransform.find(
			(entry: Record<string, number>) => "translateY" in entry,
		)?.translateY;

		// gestureY=20 on an 800px screen => normalizedY=0.025 => dragY=8 (0.4 resistance)
		// At progress=1.5, unfocusedScale=0.95, so local compensation should be dragY / 0.95.
		const expectedDeltaY = 8 / 0.95;

		expect(draggedY - baselineY).toBeCloseTo(expectedDeltaY, 5);
	});

	it("bounds({...}).navigation.zoom() compensates content shrink for scaleMode match", () => {
		registerBasicLink();
		const bounds = createAccessor("screen-a", false, 1.5, {
			gestureX: 0,
			gestureY: 0,
		});

		const styles = bounds({ id: "card", scaleMode: "match" }).navigation.zoom();
		const sharedTransform = (styles.card as any).transform;
		const contentTransform = (styles.content as any)?.style?.transform;
		const contentScale = contentTransform?.find(
			(entry: Record<string, number>) => "scale" in entry,
		)?.scale;
		const sharedScaleX = sharedTransform.find(
			(entry: Record<string, number>) => "scaleX" in entry,
		)?.scaleX;
		const sharedScaleY = sharedTransform.find(
			(entry: Record<string, number>) => "scaleY" in entry,
		)?.scaleY;

		const rawMatch = bounds({
			id: "card",
			method: "transform",
			space: "relative",
			target: "fullscreen",
			scaleMode: "match",
			raw: true,
		}) as any;

		expect(sharedScaleX * contentScale).toBeCloseTo(rawMatch.scaleX, 5);
		expect(sharedScaleY * contentScale).toBeCloseTo(rawMatch.scaleY, 5);
	});

	it("bounds({...}).navigation.zoom() scales the unfocused source element with mask shrink compensation", () => {
		registerBasicLink();
		const baselineUnfocused = createAccessor("screen-a", false, 1.5, {
			gestureX: 0,
			gestureY: 0,
		});
		const draggedUnfocused = createAccessor("screen-a", false, 1.5, {
			gestureX: 120,
			gestureY: 100,
		});

		const baselineTransform = (
			baselineUnfocused({ id: "card" }).navigation.zoom().card as any
		).transform;
		const draggedTransform = (
			draggedUnfocused({ id: "card" }).navigation.zoom().card as any
		).transform;

		const baselineScaleX = baselineTransform.find(
			(entry: Record<string, number>) => "scaleX" in entry,
		)?.scaleX;
		const baselineScaleY = baselineTransform.find(
			(entry: Record<string, number>) => "scaleY" in entry,
		)?.scaleY;
		const draggedScaleX = draggedTransform.find(
			(entry: Record<string, number>) => "scaleX" in entry,
		)?.scaleX;
		const draggedScaleY = draggedTransform.find(
			(entry: Record<string, number>) => "scaleY" in entry,
		)?.scaleY;

		const baselineFocusedMask = createAccessor("screen-b", true, 1.5, {
			gestureX: 0,
			gestureY: 0,
		})({ id: "card" }).navigation.zoom()[NAVIGATION_MASK_STYLE_ID] as any;
		const draggedFocusedMask = createAccessor("screen-b", true, 1.5, {
			gestureX: 120,
			gestureY: 100,
		})({ id: "card" }).navigation.zoom()[NAVIGATION_MASK_STYLE_ID] as any;

		const maskScaleX = draggedFocusedMask.width / baselineFocusedMask.width;
		const maskScaleY = draggedFocusedMask.height / baselineFocusedMask.height;
		const sourceCompensationX = draggedScaleX / baselineScaleX;
		const sourceCompensationY = draggedScaleY / baselineScaleY;
		const baselineFocusedContainer = createAccessor("screen-b", true, 1.5, {
			gestureX: 0,
			gestureY: 0,
		})({ id: "card" }).navigation.zoom()[
			NAVIGATION_CONTAINER_STYLE_ID
		] as any;
		const draggedFocusedContainer = createAccessor("screen-b", true, 1.5, {
			gestureX: 120,
			gestureY: 100,
		})({ id: "card" }).navigation.zoom()[
			NAVIGATION_CONTAINER_STYLE_ID
		] as any;
		const baselineContainerScale = baselineFocusedContainer.transform.find(
			(entry: Record<string, number>) => "scale" in entry,
		)?.scale;
		const draggedContainerScale = draggedFocusedContainer.transform.find(
			(entry: Record<string, number>) => "scale" in entry,
		)?.scale;
		const focusedCompensation = draggedContainerScale / baselineContainerScale;

		expect(sourceCompensationX).toBeCloseTo(focusedCompensation, 5);
		expect(sourceCompensationY).toBeCloseTo(focusedCompensation, 5);
		expect(sourceCompensationX).toBeLessThanOrEqual(maskScaleX);
		expect(sourceCompensationY).toBeLessThanOrEqual(maskScaleY);
	});

	it("bounds({...}).navigation.zoom() scales focused screen from source-width ratio", () => {
		registerBasicLink();
		const bounds = createAccessor("screen-b", true, 0);

		const styles = bounds({ id: "card" }).navigation.zoom();
		const containerStyle = styles[NAVIGATION_CONTAINER_STYLE_ID] as any;
		const scaleEntry = containerStyle?.transform?.find(
			(entry: Record<string, number>) => "scale" in entry,
		);

		expect(scaleEntry?.scale).toBe(0.25);
	});

});
