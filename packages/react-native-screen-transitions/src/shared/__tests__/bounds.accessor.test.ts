import { beforeEach, describe, expect, it } from "bun:test";
import {
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_HOST_FLAG_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
} from "../constants";
import { BoundStore } from "../stores/bounds.store";
import { createBounds } from "../utils/bounds";

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
		currentProgress?: number;
		activeClosing?: number;
		gestureX?: number;
		gestureY?: number;
	} = {},
) => {
	const currentProgress = options.currentProgress ?? 1;
	const activeClosing = options.activeClosing ?? 0;
	const gestureX = options.gestureX ?? 0;
	const gestureY = options.gestureY ?? 0;

	return createBounds({
		previous: undefined,
		current: {
			route: { key: currentKey },
			progress: currentProgress,
			closing: activeClosing,
			gesture: {
				x: gestureX,
				y: gestureY,
			},
		} as any,
		next: undefined,
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
		inactive: undefined,
		isActiveTransitioning: false,
		isDismissing: false,
	} as any);
};

const registerBasicLink = (tag = "card") => {
	BoundStore.setLinkSource(tag, "screen-a", createMeasured(0, 0, 100, 100));
	BoundStore.setLinkDestination(tag, "screen-b", createMeasured(100, 100, 220, 220));
};

beforeEach(() => {
	(globalThis as any).resetMutableRegistry();
});

describe("createBounds accessor", () => {
	it("match(...).style() matches legacy bounds({...}) output", () => {
		registerBasicLink();

		const bounds = createAccessor();
		const legacy = bounds({ id: "card", method: "transform", space: "relative" });
		const chained = bounds
			.match({ id: "card" })
			.style({ method: "transform", space: "relative" });

		expect(chained).toEqual(legacy);
	});

	it("legacy bounds({...}) uses boundary defaults and allows per-call override", () => {
		registerBasicLink();
		BoundStore.registerBoundaryPresence("card", "screen-b", undefined, {
			method: "size",
			space: "absolute",
		});

		const bounds = createAccessor();

		const fromBoundaryDefaults = bounds({ id: "card" }) as any;
		expect(fromBoundaryDefaults.width).toBeDefined();
		expect(fromBoundaryDefaults.height).toBeDefined();

		const overridden = bounds({ id: "card", method: "transform" }) as any;
		expect(overridden.width).toBeUndefined();
		expect(overridden.height).toBeUndefined();
	});

	it("match(...).style() uses boundary defaults and allows per-call override", () => {
		registerBasicLink();
		BoundStore.registerBoundaryPresence("card", "screen-b", undefined, {
			method: "size",
			space: "absolute",
		});

		const bounds = createAccessor();

		const fromBoundaryDefaults = bounds.match({ id: "card" }).style() as any;
		expect(fromBoundaryDefaults.width).toBeDefined();
		expect(fromBoundaryDefaults.height).toBeDefined();

		const overridden = bounds
			.match({ id: "card" })
			.style({ method: "transform" }) as any;
		expect(overridden.width).toBeUndefined();
		expect(overridden.height).toBeUndefined();
	});

	it("match(...).style() updates group active id", () => {
		const bounds = createAccessor();

		bounds.match({ id: "42", group: "feed" }).style();

		expect(BoundStore.getGroupActiveId("feed")).toBe("42");
	});

	it("match(...).navigation.hero() returns focused navigation styles and mask host flag", () => {
		registerBasicLink();
		const bounds = createAccessor("screen-b");

		const styles = bounds.match({ id: "card" }).navigation.hero();

		expect(styles[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]).toEqual({});
		expect(styles[NAVIGATION_CONTAINER_STYLE_ID]).toBeDefined();
		expect(styles[NAVIGATION_MASK_STYLE_ID]).toBeDefined();
		expect(styles.card).toBeUndefined();
	});

	it("match(...).navigation.hero() returns unfocused shared-element style", () => {
		registerBasicLink();
		const bounds = createAccessor("screen-a", false);

		const styles = bounds.match({ id: "card" }).navigation.hero();

		expect(styles[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]).toBeUndefined();
		expect(styles.card).toBeDefined();
		expect(styles[NAVIGATION_CONTAINER_STYLE_ID]).toBeUndefined();
		expect(styles[NAVIGATION_MASK_STYLE_ID]).toBeUndefined();
	});

	it("match(...).navigation.zoom() defaults to top anchoring and allows overrides", () => {
		registerBasicLink();
		BoundStore.registerBoundaryPresence("card", "screen-b", undefined, {
			anchor: "bottom",
		});
		const bounds = createAccessor("screen-b");

		const inherited = bounds.match({ id: "card" }).navigation.zoom();
		const overridden = bounds
			.match({ id: "card" })
			.navigation.zoom({ anchor: "center" });

		expect(inherited[NAVIGATION_CONTAINER_STYLE_ID]).toBeDefined();
		expect(overridden[NAVIGATION_CONTAINER_STYLE_ID]).toBeDefined();
	});

	it("match(...).navigation.zoom() uses top anchor preset when no boundary defaults exist", () => {
		registerBasicLink();
		const bounds = createAccessor("screen-b");

		const presetDefault = bounds.match({ id: "card" }).navigation.zoom();
		const explicitTop = bounds
			.match({ id: "card" })
			.navigation.zoom({ anchor: "top" });

		expect(presetDefault[NAVIGATION_CONTAINER_STYLE_ID]).toEqual(
			explicitTop[NAVIGATION_CONTAINER_STYLE_ID],
		);
	});

	it("match(...).navigation.zoom() enables mask host only for focused screen", () => {
		registerBasicLink();
		const focusedBounds = createAccessor("screen-b", true);
		const unfocusedBounds = createAccessor("screen-a", false);

		const focusedStyles = focusedBounds.match({ id: "card" }).navigation.zoom();
		const unfocusedStyles = unfocusedBounds
			.match({ id: "card" })
			.navigation.zoom();
		const focusedContainer = focusedStyles[NAVIGATION_CONTAINER_STYLE_ID] as any;

		expect(focusedStyles[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]).toEqual({});
		expect(unfocusedStyles[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]).toBeUndefined();
		expect(focusedContainer.opacity).toBeDefined();
	});

	it("match(...).navigation.zoom() keeps full opacity when not closing", () => {
		registerBasicLink();
		const openingBounds = createAccessor("screen-b", true, 0.1, {
			activeClosing: 0,
			currentProgress: 0.1,
		});

		const openingStyles = openingBounds.match({ id: "card" }).navigation.zoom();
		const openingOpacity = (openingStyles[NAVIGATION_CONTAINER_STYLE_ID] as any)
			.opacity;

		expect(openingOpacity).toBe(1);
	});

	it("match(...).navigation.zoom() fades focused screen only while closing", () => {
		registerBasicLink();
		const closingBounds = createAccessor("screen-b", true, 0.5, {
			activeClosing: 1,
			currentProgress: 0.4,
		});

		const closingStyles = closingBounds.match({ id: "card" }).navigation.zoom();
		const closingOpacity = (closingStyles[NAVIGATION_CONTAINER_STYLE_ID] as any)
			.opacity;

		expect(closingOpacity).toBe(0.4);
	});

	it("match(...).navigation.zoom() scales unfocused contentStyle from 1 to 0.95", () => {
		registerBasicLink();
		const unfocusedBounds = createAccessor("screen-a", false, 1.5);
		const styles = unfocusedBounds.match({ id: "card" }).navigation.zoom();
		const contentStyle = styles.contentStyle as any;
		const scaleEntry = contentStyle?.transform?.find(
			(entry: Record<string, number>) => "scale" in entry,
		);

		expect(scaleEntry?.scale).toBe(0.975);
	});

	it("match(...).navigation.zoom() applies freeform drag to focused translation", () => {
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
			baseline.match({ id: "card" }).navigation.zoom()[
				NAVIGATION_CONTAINER_STYLE_ID
			] as any
		).transform;
		const draggedTransform = (
			dragged.match({ id: "card" }).navigation.zoom()[
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

		expect(draggedX - baselineX).toBeCloseTo(24 * 0.2, 5);
		expect(draggedY - baselineY).toBeCloseTo(-18 * 0.2, 5);
	});

	it("match(...).navigation.zoom() applies freeform drag to focused mask", () => {
		registerBasicLink();
		const baseline = createAccessor("screen-b", true, 0.5, {
			gestureX: 0,
			gestureY: 0,
		});
		const dragged = createAccessor("screen-b", true, 0.5, {
			gestureX: 12,
			gestureY: 9,
		});

		const baselineMaskStyle = baseline.match({ id: "card" }).navigation.zoom()[
			NAVIGATION_MASK_STYLE_ID
		] as any;
		const draggedMaskStyle = dragged.match({ id: "card" }).navigation.zoom()[
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
		expect(draggedX - baselineX).toBeLessThan(12);
		expect(draggedY - baselineY).toBeLessThan(9);
		expect(draggedMaskStyle.width).toBeLessThan(baselineMaskStyle.width);
		expect(draggedMaskStyle.height).toBeLessThan(baselineMaskStyle.height);
	});

	it("match(...).navigation.zoom() keeps unfocused contentStyle as scale-only", () => {
		registerBasicLink();
		const styles = createAccessor("screen-a", false, 1.5, {
			gestureX: -15,
			gestureY: 20,
		})
			.match({ id: "card" })
			.navigation.zoom();

		const contentTransform = (styles.contentStyle as any)?.transform;
		const hasTranslateX = contentTransform?.some(
			(entry: Record<string, number>) => "translateX" in entry,
		);
		const hasTranslateY = contentTransform?.some(
			(entry: Record<string, number>) => "translateY" in entry,
		);

		expect(hasTranslateX).toBe(false);
		expect(hasTranslateY).toBe(false);
	});

	it("match(...).navigation.zoom() applies freeform drag to unfocused source element", () => {
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
			baseline.match({ id: "card" }).navigation.zoom().card as any
		).transform;
		const draggedTransform = (
			dragged.match({ id: "card" }).navigation.zoom().card as any
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

		expect(draggedX - baselineX).toBeCloseTo(-15 * 0.2, 5);
		expect(draggedY - baselineY).toBeCloseTo(20 * 0.2, 5);
	});

	it("match(...).navigation.zoom() scales focused screen from source-width ratio", () => {
		registerBasicLink();
		const bounds = createAccessor("screen-b", true, 0);

		const styles = bounds.match({ id: "card" }).navigation.zoom();
		const containerStyle = styles[NAVIGATION_CONTAINER_STYLE_ID] as any;
		const scaleEntry = containerStyle?.transform?.find(
			(entry: Record<string, number>) => "scale" in entry,
		);

		expect(scaleEntry?.scale).toBe(0.25);
	});

});
